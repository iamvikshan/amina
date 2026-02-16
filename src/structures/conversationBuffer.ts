// @root/src/structures/conversationBuffer.ts

import Logger from '@helpers/Logger'
import {
  upsertConversation,
  loadConversation,
  deleteConversation,
} from '@schemas/Conversation'

// ContentPart is globally declared in types/services.d.ts
export interface Message {
  role: 'user' | 'model'
  parts: ContentPart[]
  timestamp: number
  // User attribution fields (optional for backward compatibility)
  userId?: string // Discord user ID
  username?: string // Display name for context
  displayName?: string // Guild nickname or username
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

  /**
   * Extract text content from a parts-based message.
   * Parts are joined with a space so adjacent texts don't merge;
   * empty text parts are skipped and surrounding whitespace is trimmed.
   */
  static getTextContent(message: Message): string {
    return message.parts
      .map(part => ('text' in part ? part.text.trim() : null))
      .filter((text): text is string => text !== null && text !== '')
      .join(' ')
  }

  /**
   * Format a message with speaker attribution for AI context.
   * Preserves non-text parts (images, function calls, etc.)
   */
  static formatWithAttribution(msg: Message): ConversationMessage {
    if (msg.role === 'model') {
      return { role: 'model', parts: msg.parts }
    }
    if (msg.userId && msg.displayName) {
      const textContent = ConversationBuffer.getTextContent(msg).trim()
      const nonTextParts = msg.parts.filter(p => !('text' in p))
      if (textContent) {
        return {
          role: 'user',
          parts: [
            { text: `${msg.displayName}: ${textContent}` },
            ...nonTextParts,
          ],
        }
      }
      // No text content — return only non-text parts
      return {
        role: 'user',
        parts: nonTextParts.length > 0 ? nonTextParts : msg.parts,
      }
    }
    return { role: 'user', parts: msg.parts }
  }

  /**
   * Append a text message (auto-converts to parts format)
   */
  append(
    conversationId: string,
    role: 'user' | 'model',
    content: string,
    userId?: string,
    username?: string,
    displayName?: string
  ) {
    if (!content || !content.trim()) return // Skip empty/whitespace-only content
    this.appendParts(
      conversationId,
      role,
      [{ text: content }],
      userId,
      username,
      displayName
    )
  }

  /**
   * Append a message with full parts (preserves function calls, media, etc.)
   */
  appendParts(
    conversationId: string,
    role: 'user' | 'model',
    parts: ContentPart[],
    userId?: string,
    username?: string,
    displayName?: string
  ) {
    if (parts.length === 0) return // No-op for empty parts

    // Clear tombstone if conversation is being recreated after a clear()
    this.clearedTimestamps.delete(conversationId)

    const entry = this.cache.get(conversationId) || {
      messages: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }

    const message: Message = {
      role,
      parts: structuredClone(parts), // Defensive copy to prevent external mutations
      timestamp: Date.now(),
    }

    // Add user attribution for user messages
    if (role === 'user' && userId) {
      message.userId = userId
      if (username) message.username = username
      if (displayName) message.displayName = displayName
    }

    entry.messages.push(message)

    // Trim to max messages (ring buffer behavior)
    if (entry.messages.length > this.MAX_MESSAGES) {
      entry.messages.shift()
    }

    entry.lastActivityAt = Date.now()
    this.cache.set(conversationId, entry)

    Logger.debug(
      `Message appended - ConvID: ${conversationId}, Role: ${role}, Count: ${entry.messages.length}`
    )

    // Fire-and-forget persistence to MongoDB
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
   */
  private validateDbMessages(dbMessages: any[]): Message[] {
    const validated: Message[] = []
    for (const doc of dbMessages) {
      // role must be 'user' or 'model'
      const role = doc?.role
      if (role !== 'user' && role !== 'model') continue

      // parts must be an array; default to empty array if missing/invalid
      const parts: ContentPart[] = Array.isArray(doc.parts) ? doc.parts : []

      // timestamp must be a number; default to current time if missing
      const timestamp =
        typeof doc.timestamp === 'number' ? doc.timestamp : Date.now()

      const msg: Message = { role, parts, timestamp }
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
