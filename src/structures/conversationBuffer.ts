// @root/src/structures/conversationBuffer.ts

import Logger from '../helpers/Logger'

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
  }

  getHistory(conversationId: string, maxMessages = 9): Message[] {
    const entry = this.cache.get(conversationId)

    if (!entry || Date.now() - entry.lastActivityAt > this.TTL_MS) {
      this.cache.delete(conversationId)
      return []
    }

    // Return last N messages
    const messages = maxMessages <= 0 ? [] : entry.messages.slice(-maxMessages)
    Logger.debug(
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
      Logger.debug(
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
