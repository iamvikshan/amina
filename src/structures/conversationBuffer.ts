// @root/src/structures/conversationBuffer.ts

import Logger from '../helpers/Logger'

const logger = Logger

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
  private readonly MAX_MESSAGES = 20
  private readonly TTL_MS = 10 * 60 * 1000 // 10 minutes
  private cleanupInterval: Timer | null = null

  constructor() {
    // Start daemon cleanup every 5 minutes
    this.startCleanupDaemon()
  }

  /**
   * Extract text content from a parts-based message
   */
  static getTextContent(message: Message): string {
    return message.parts
      .map(part => (typeof part.text === 'string' ? part.text : null))
      .filter((text): text is string => text !== null)
      .join('')
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
      const textContent = ConversationBuffer.getTextContent(msg)
      const attributedText = `${msg.displayName}: ${textContent}`
      const nonTextParts = msg.parts.filter(p => p.text == null)
      return {
        role: 'user',
        parts: [{ text: attributedText }, ...nonTextParts],
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
    const entry = this.cache.get(conversationId) || {
      messages: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }

    const message: Message = {
      role,
      parts: [...parts], // Defensive copy to prevent external mutations
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

    logger.debug(
      `Message appended - ConvID: ${conversationId}, Role: ${role}, Count: ${entry.messages.length}`
    )
  }

  getHistory(conversationId: string, maxMessages = 9): Message[] {
    const entry = this.cache.get(conversationId)

    if (!entry || Date.now() - entry.lastActivityAt > this.TTL_MS) {
      this.cache.delete(conversationId)
      return []
    }

    // Return last N messages
    const messages = maxMessages <= 0 ? [] : entry.messages.slice(-maxMessages)
    logger.debug(
      `Retrieved conversation history - ConvID: ${conversationId}, Count: ${messages.length}`
    )

    return messages
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

    if (prunedCount > 0) {
      logger.debug(
        `Pruned expired conversations - Removed: ${prunedCount}, Remaining: ${this.cache.size}`
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

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instance
export const conversationBuffer = new ConversationBuffer()
