// @root/src/structures/conversationBuffer.ts

import Logger from '@helpers/Logger'
import {
  upsertConversation,
  loadConversation,
  deleteConversation,
} from '@schemas/Conversation'

export interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  timestamp: number
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
  userId?: string
  username?: string
  displayName?: string
}

interface ConversationEntry {
  messages: Message[]
  createdAt: number
  lastActivityAt: number
}

export class ConversationBuffer {
  private cache: Map<string, ConversationEntry> = new Map()
  /** Per-conversation loading lock to prevent duplicate DB restores */
  private loadingPromises: Map<string, Promise<Message[]>> = new Map()
  private readonly MAX_MESSAGES = 20
  private readonly TTL_MS = 30 * 60 * 1000 // 30 minutes
  private cleanupInterval: Timer | null = null
  /** Tombstone map: conversations recently cleared (value = timestamp) that should not be restored from DB */
  private clearedTimestamps: Map<string, number> = new Map()
  private pendingPersists: Map<string, Timer> = new Map()
  private pendingPersistPromises: Map<
    string,
    { promise: Promise<void>; resolvers: Array<() => void> }
  > = new Map()
  private readonly PERSIST_DEBOUNCE_MS = 2000 // 2 second debounce

  constructor() {
    // Start daemon cleanup every 5 minutes
    this.startCleanupDaemon()
  }

  static getTextContent(message: Message): string {
    return message.content ?? ''
  }

  static formatWithAttribution(msg: Message): ChatMessage {
    if (msg.role === 'assistant') {
      const m: ChatMessage = { role: 'assistant', content: msg.content }
      if (msg.tool_calls?.length) m.tool_calls = msg.tool_calls
      return m
    }
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        name: msg.name,
      }
    }
    if (msg.role === 'system') {
      return { role: 'system', content: msg.content }
    }
    if (msg.userId && msg.displayName) {
      const text = msg.content?.trim() ?? ''
      return {
        role: 'user',
        content: text ? `${msg.displayName}: ${text}` : text,
      }
    }
    return { role: 'user', content: msg.content }
  }

  /**
   * Ensure tool call/response pairs are complete after slicing history.
   * Strips orphaned tool messages and removes tool_calls from assistant
   * messages whose matching tool responses were sliced off.
   * @param messages
   */
  static sanitizeToolPairs(messages: Message[]): Message[] {
    if (messages.length === 0) return messages

    // Drop leading orphan tool messages AND convert leading assistant+tool
    // groups whose triggering user message was sliced off (preserve text).
    let start = 0
    const preserved: Message[] = []
    while (start < messages.length) {
      const m = messages[start]
      if (m.role === 'tool') {
        start++
      } else if (
        m.role === 'assistant' &&
        m.tool_calls &&
        m.tool_calls.length > 0
      ) {
        // Skip trailing tool responses, but keep assistant text (stripped)
        let j = start + 1
        while (j < messages.length && messages[j].role === 'tool') j++
        if (m.content && m.content.trim()) {
          preserved.push({ ...m, tool_calls: undefined })
        }
        start = j
      } else {
        break
      }
    }
    const trimmed = start > 0 ? messages.slice(start) : messages

    const result: Message[] = [...preserved]
    let i = 0
    while (i < trimmed.length) {
      const msg = trimmed[i]

      if (
        msg.role === 'assistant' &&
        msg.tool_calls &&
        msg.tool_calls.length > 0
      ) {
        // Collect expected tool_call IDs
        const expectedIds = new Set(msg.tool_calls.map(tc => tc.id))
        const matchedIds = new Set<string>()
        const toolResponses: Message[] = []
        let j = i + 1
        while (j < trimmed.length && trimmed[j].role === 'tool') {
          const tcId = trimmed[j].tool_call_id
          if (tcId && expectedIds.has(tcId) && !matchedIds.has(tcId)) {
            matchedIds.add(tcId)
            toolResponses.push(trimmed[j])
          }
          j++
        }

        if (matchedIds.size === expectedIds.size) {
          // Complete pair -- keep assistant + all tool responses
          result.push(msg)
          result.push(...toolResponses)
        } else {
          // Incomplete -- keep assistant text only, strip tool_calls
          result.push({
            ...msg,
            tool_calls: undefined,
          })
        }
        i = j // Skip past the tool messages
      } else {
        // Drop orphan tool messages not paired with a preceding assistant tool_call
        if (msg.role !== 'tool') {
          result.push(msg)
        }
        i++
      }
    }
    return result
  }

  append(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    userId?: string,
    username?: string,
    displayName?: string
  ) {
    if (!content || !content.trim()) return
    this.appendMessage(conversationId, {
      role,
      content,
      timestamp: Date.now(),
      ...(role === 'user' && userId ? { userId, username, displayName } : {}),
    })
  }

  appendAssistantMessage(
    conversationId: string,
    content: string,
    toolCalls?: ToolCall[]
  ) {
    this.appendMessage(conversationId, {
      role: 'assistant',
      content,
      timestamp: Date.now(),
      tool_calls: toolCalls,
    })
  }

  appendToolResult(
    conversationId: string,
    toolCallId: string,
    name: string,
    content: string
  ) {
    this.appendMessage(conversationId, {
      role: 'tool',
      content,
      timestamp: Date.now(),
      tool_call_id: toolCallId,
      name,
    })
  }

  private appendMessage(conversationId: string, message: Message) {
    this.clearedTimestamps.delete(conversationId)

    const entry = this.cache.get(conversationId) || {
      messages: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }

    entry.messages.push(structuredClone(message))

    if (entry.messages.length > this.MAX_MESSAGES) {
      entry.messages.shift()
    }

    entry.lastActivityAt = Date.now()
    this.cache.set(conversationId, entry)

    Logger.debug(
      `Message appended - ConvID: ${conversationId}, Role: ${message.role}, Count: ${entry.messages.length}`
    )

    this.persistToDb(conversationId, entry.messages).catch((err: any) =>
      Logger.warn(
        `Failed to persist conversation ${conversationId}: ${err.message}`
      )
    )
  }

  async getHistory(
    conversationId: string,
    maxMessages = 9
  ): Promise<Message[]> {
    const entry = this.cache.get(conversationId)

    if (entry) {
      // Check if expired
      if (Date.now() - entry.lastActivityAt > this.TTL_MS) {
        this.cache.delete(conversationId)
        return []
      }

      // Cache hit — return from memory
      const messages =
        maxMessages <= 0 ? [] : entry.messages.slice(-maxMessages)
      Logger.debug(
        `Retrieved conversation history - ConvID: ${conversationId}, Count: ${messages.length}`
      )
      return messages
    }

    // Cache miss — try loading from MongoDB
    // Skip DB load if this conversation was recently cleared (tombstone)
    const clearedAt = this.clearedTimestamps.get(conversationId)
    if (clearedAt !== undefined && Date.now() - clearedAt < this.TTL_MS)
      return []

    // Use per-conversation loading lock to prevent duplicate DB restores
    let loadPromise = this.loadingPromises.get(conversationId)
    if (!loadPromise) {
      loadPromise = this.loadFromDb(conversationId).finally(() => {
        this.loadingPromises.delete(conversationId)
      })
      this.loadingPromises.set(conversationId, loadPromise)
    }

    const loaded = await loadPromise
    return maxMessages <= 0 ? [] : loaded.slice(-maxMessages)
  }

  /**
   * Load conversation from DB and restore to cache.
   * Isolated method to serve as the deduplicated loading target.
   * @param conversationId
   */
  private async loadFromDb(conversationId: string): Promise<Message[]> {
    try {
      const dbMessages = await loadConversation(conversationId, this.TTL_MS)
      if (dbMessages && dbMessages.length > 0) {
        const validatedMessages = this.validateDbMessages(dbMessages)
        if (validatedMessages.length === 0) return []

        // Check tombstone before restoring — conversation may have been cleared during DB load
        const clearedAt = this.clearedTimestamps.get(conversationId)
        if (clearedAt !== undefined && Date.now() - clearedAt < this.TTL_MS)
          return []

        const now = Date.now()
        const restoredEntry: ConversationEntry = {
          messages: validatedMessages,
          createdAt: now,
          lastActivityAt: now,
        }
        this.cache.set(conversationId, restoredEntry)
        Logger.debug(
          `Restored conversation from DB - ConvID: ${conversationId}, Count: ${validatedMessages.length}`
        )
        return validatedMessages
      }
    } catch (error: any) {
      Logger.warn(`Failed to load conversation from DB: ${error.message}`)
    }
    return []
  }

  /**
   * Validate and normalize raw DB documents into the expected Message shape.
   * Filters out any documents that cannot be meaningfully converted.
   * @param dbMessages
   */
  private validateDbMessages(dbMessages: any[]): Message[] {
    const validated: Message[] = []
    for (const doc of dbMessages) {
      const role = doc?.role
      if (
        role !== 'user' &&
        role !== 'assistant' &&
        role !== 'tool' &&
        role !== 'system'
      )
        continue

      const content = typeof doc.content === 'string' ? doc.content : ''
      const timestamp =
        typeof doc.timestamp === 'number' ? doc.timestamp : Date.now()

      const msg: Message = { role, content, timestamp }
      if (Array.isArray(doc.tool_calls)) msg.tool_calls = doc.tool_calls
      if (typeof doc.tool_call_id === 'string')
        msg.tool_call_id = doc.tool_call_id
      if (typeof doc.name === 'string') msg.name = doc.name
      if (doc.userId) msg.userId = String(doc.userId)
      if (doc.username) msg.username = String(doc.username)
      if (doc.displayName) msg.displayName = String(doc.displayName)
      validated.push(msg)
    }
    return validated
  }

  pruneExpired() {
    const now = Date.now()
    let prunedCount = 0

    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.lastActivityAt > this.TTL_MS) {
        this.cache.delete(id)
        prunedCount++
      }
    }

    // Prune stale tombstones
    for (const [id, timestamp] of this.clearedTimestamps.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.clearedTimestamps.delete(id)
        prunedCount++
      }
    }

    if (prunedCount > 0) {
      Logger.debug(
        `Pruned expired conversations/tombstones - Removed: ${prunedCount}, Remaining: ${this.cache.size}`
      )
    }
  }

  private startCleanupDaemon() {
    this.cleanupInterval = setInterval(
      () => {
        this.pruneExpired()
      },
      5 * 60 * 1000
    ) // Every 5 minutes
  }

  /**
   * Debounced persistence to MongoDB.
   * Waits PERSIST_DEBOUNCE_MS before writing to avoid rapid writes
   * during ReAct loops.
   * @param conversationId
   * @param _messages
   */
  private persistToDb(
    conversationId: string,
    _messages: Message[]
  ): Promise<void> {
    const existing = this.pendingPersistPromises.get(conversationId)

    // Clear any pending timer for this conversation
    const existingTimer = this.pendingPersists.get(conversationId)
    if (existingTimer) clearTimeout(existingTimer)

    if (existing) {
      // Already have a pending promise — add a new resolver and reschedule the timer
      return new Promise<void>(resolve => {
        existing.resolvers.push(resolve)
        const timer = setTimeout(async () => {
          this.pendingPersists.delete(conversationId)
          this.pendingPersistPromises.delete(conversationId)
          try {
            // Read fresh messages from cache to avoid stale captures
            const fresh = this.cache.get(conversationId)?.messages ?? []
            await upsertConversation(conversationId, fresh, this.MAX_MESSAGES)
          } catch (err: any) {
            Logger.warn(`Failed to persist conversation: ${err.message}`)
          }
          for (const r of existing.resolvers) r()
        }, this.PERSIST_DEBOUNCE_MS)
        this.pendingPersists.set(conversationId, timer)
      })
    }

    // Create a new shared promise entry
    const entry: { promise: Promise<void>; resolvers: Array<() => void> } = {
      resolvers: [],
      promise: null as any,
    }

    entry.promise = new Promise<void>(resolve => {
      entry.resolvers.push(resolve)
      const timer = setTimeout(async () => {
        this.pendingPersists.delete(conversationId)
        this.pendingPersistPromises.delete(conversationId)
        try {
          // Read fresh messages from cache to avoid stale captures
          const fresh = this.cache.get(conversationId)?.messages ?? []
          await upsertConversation(conversationId, fresh, this.MAX_MESSAGES)
        } catch (err: any) {
          Logger.warn(`Failed to persist conversation: ${err.message}`)
        }
        for (const r of entry.resolvers) r()
      }, this.PERSIST_DEBOUNCE_MS)
      this.pendingPersists.set(conversationId, timer)
    })

    this.pendingPersistPromises.set(conversationId, entry)
    return entry.promise
  }

  /**
   * Clear a conversation from both cache and database.
   * @param conversationId
   */
  clear(conversationId: string) {
    this.cache.delete(conversationId)
    // Tombstone: prevent DB restore until new messages are appended
    this.clearedTimestamps.set(conversationId, Date.now())
    // Cancel any pending persist for this conversation
    const pending = this.pendingPersists.get(conversationId)
    if (pending) {
      clearTimeout(pending)
      this.pendingPersists.delete(conversationId)
    }
    this.pendingPersistPromises.delete(conversationId)
    deleteConversation(conversationId).catch((err: any) =>
      Logger.warn(`Failed to delete conversation from DB: ${err.message}`)
    )
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    // Clear pending debounced writes
    for (const timer of this.pendingPersists.values()) {
      clearTimeout(timer)
    }
    this.pendingPersists.clear()
    this.pendingPersistPromises.clear()
  }
}

// Singleton instance
export const conversationBuffer = new ConversationBuffer()
