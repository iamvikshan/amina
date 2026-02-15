// @root/src/services/memoryService.ts

import { Index } from '@upstash/vector'
import { GoogleGenAI } from '@google/genai'
import Logger from '../helpers/Logger'
import {
  saveMemory,
  getUserMemories,
  updateMemoryAccess,
  deleteUserMemories,
  getMemoryStats,
  pruneMemories,
  getUserMemoryCount,
  deleteOldestMemories,
  Model,
} from '../database/schemas/AiMemory'
import {
  ConversationBuffer,
  type Message,
} from '../structures/conversationBuffer'

const logger = Logger

// MemoryFact and RecalledMemory are now globally available - see types/services.d.ts

export class MemoryService {
  private upstashIndex: Index | null = null
  private ai: GoogleGenAI | null = null
  private embeddingModel: string = 'text-embedding-005' // fallback; overridden by config
  private extractionModel: string = 'gemini-2.5-flash-lite' // fallback; overridden by config
  private readonly MAX_MEMORIES_PER_USER = 50 // Max memories per user per context (DM or guild)

  async initialize(
    geminiKey: string,
    upstashUrl: string,
    upstashToken: string,
    embeddingModel?: string,
    extractionModel?: string
  ) {
    try {
      // Initialize Upstash Vector
      this.upstashIndex = new Index({
        url: upstashUrl,
        token: upstashToken,
      })

      // Initialize Gemini for embeddings
      this.ai = new GoogleGenAI({ apiKey: geminiKey })

      // Use configured models if provided
      if (embeddingModel) this.embeddingModel = embeddingModel
      if (extractionModel) this.extractionModel = extractionModel

      logger.success('Memory Service initialized with Upstash Vector')
    } catch (error: any) {
      logger.error(
        `Failed to initialize Memory Service: ${error.message}`,
        error
      )
    }
  }

  /**
   * Extract memories from a conversation
   */
  async extractMemories(
    conversationHistory: Message[],
    _userId: string,
    _guildId: string | null
  ): Promise<MemoryFact[]> {
    if (!this.ai || conversationHistory.length < 3) return []

    try {
      // Build conversation context with speaker attribution
      const conversationText = conversationHistory
        .slice(-10) // Last 10 messages
        .map(m => {
          const text = ConversationBuffer.getTextContent(m)
          if (m.role === 'model') {
            return `model: ${text}`
          }
          // User message with attribution if available
          if (m.userId && m.displayName) {
            return `${m.displayName}: ${text}`
          }
          // Fallback for old messages without attribution
          return `user: ${text}`
        })
        .join('\n')

      const extractionPrompt = `Analyze this conversation and extract 0-3 important facts worth remembering long-term.
Only extract clearly stated information (user preferences, names, important events, recurring topics).
Ignore casual greetings and temporary information.

Conversation:
${conversationText}

Return ONLY valid JSON array (no markdown, no explanation):
[
  {"key": "fact_name", "value": "fact_value", "importance": 1-10, "memoryType": "user|guild|topic"}
]

If nothing worth remembering, return: []`

      const result = await this.ai.models.generateContent({
        model: this.extractionModel,
        contents: extractionPrompt,
      })
      const response = (result.text ?? '').trim()

      // Clean response - remove markdown code blocks if present
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const facts: MemoryFact[] = JSON.parse(cleanResponse)

      logger.debug(`Extracted ${facts.length} memories from conversation`)
      return facts
    } catch (error: any) {
      logger.warn(`Failed to extract memories: ${error.message}`)
      return []
    }
  }

  /**
   * Store a memory in both MongoDB and Upstash
   */
  async storeMemory(
    fact: MemoryFact,
    userId: string,
    guildId: string | null,
    context: string
  ): Promise<boolean> {
    if (!this.upstashIndex || !this.ai) return false

    try {
      // Generate embedding for the memory
      const embeddingText = `${fact.key}: ${fact.value}`
      const embeddingResult = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: embeddingText,
      })
      const embedding = embeddingResult.embeddings?.[0]?.values
      if (!embedding) {
        logger.warn('Failed to generate embedding: no values returned')
        return false
      }

      // Generate unique vector ID
      const vectorId = `mem_${userId}_${guildId || 'dm'}_${Date.now()}`

      // Store vector in Upstash
      await this.upstashIndex.upsert({
        id: vectorId,
        vector: embedding,
        metadata: {
          userId,
          guildId: guildId || 'dm',
          key: fact.key,
          value: fact.value,
          importance: fact.importance,
        },
      })

      // Store metadata in MongoDB
      await saveMemory({
        userId,
        guildId,
        memoryType: fact.memoryType || 'user',
        key: fact.key,
        value: fact.value,
        context,
        importance: fact.importance,
        vectorId,
      })

      // Check memory limit and delete oldest if exceeded
      const currentCount = await getUserMemoryCount(userId, guildId)
      if (currentCount > this.MAX_MEMORIES_PER_USER) {
        const { deletedCount, vectorIds } = await deleteOldestMemories(
          userId,
          guildId,
          this.MAX_MEMORIES_PER_USER
        )

        // Delete from Upstash as well
        if (vectorIds.length > 0 && this.upstashIndex) {
          try {
            await this.upstashIndex.delete(vectorIds)
            logger.debug(
              `Deleted ${deletedCount} oldest memories for user ${userId} (context: ${guildId || 'DM'})`
            )
          } catch (error: any) {
            logger.warn(
              `Failed to delete old memories from Upstash: ${error.message}`
            )
          }
        }
      }

      logger.debug(`Stored memory: ${fact.key} for user ${userId}`)
      return true
    } catch (error: any) {
      logger.error(`Failed to store memory: ${error.message}`, error)
      return false
    }
  }

  /**
   * Recall relevant memories for a message
   */
  async recallMemories(
    userMessage: string,
    userId: string,
    guildId: string | null,
    limit = 5,
    userPrefs?: {
      combineDmWithServer?: boolean
      globalServerMemories?: boolean
    }
  ): Promise<RecalledMemory[]> {
    if (!this.upstashIndex || !this.ai) return []

    try {
      // Generate embedding for the query
      const embeddingResult = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: userMessage,
      })
      const queryVector = embeddingResult.embeddings?.[0]?.values
      if (!queryVector) {
        logger.warn('Failed to generate query embedding: no values returned')
        return []
      }

      // Query Upstash for similar memories
      const results = await this.upstashIndex.query({
        vector: queryVector,
        topK: limit * 3, // Get more to filter by user/guild/preferences
        includeMetadata: true,
      })

      // STRICT filtering with user preferences
      const memories: RecalledMemory[] = results
        .filter(r => {
          const meta = r.metadata as any
          // Must match user
          if (meta.userId !== userId) return false

          const memoryGuildId = meta.guildId
          const isDmMemory = memoryGuildId === null || memoryGuildId === 'dm'
          const isServerMemory =
            memoryGuildId !== null && memoryGuildId !== 'dm'

          if (guildId) {
            // Server context
            if (userPrefs?.combineDmWithServer) {
              // Allow both server AND DM memories
              if (isServerMemory) {
                // Server memory: check global preference
                if (userPrefs?.globalServerMemories !== false) {
                  // Global: allow all server memories
                  return true
                } else {
                  // Per-server: only current server
                  return memoryGuildId === guildId
                }
              } else {
                // DM memory: allow if combining
                return true
              }
            } else {
              // ONLY server memories (strict)
              if (isServerMemory) {
                // Server memory: check global preference
                if (userPrefs?.globalServerMemories !== false) {
                  // Global: allow all server memories
                  return true
                } else {
                  // Per-server: only current server
                  return memoryGuildId === guildId
                }
              } else {
                // DM memory: reject (strict separation)
                return false
              }
            }
          } else {
            // DM context
            if (userPrefs?.combineDmWithServer) {
              // Allow both DM AND server memories
              return true
            } else {
              // ONLY DM memories (strict)
              return isDmMemory
            }
          }
        })
        .slice(0, limit)
        .map(r => {
          const meta = r.metadata as any
          return {
            id: r.id,
            key: meta.key,
            value: meta.value,
            score: r.score || 0,
            context: '', // We'll fetch from MongoDB if needed
          }
        })

      // Update access tracking in MongoDB
      // Use appropriate query based on preferences for MongoDB lookup
      const mongoQueryGuildId =
        userPrefs?.globalServerMemories !== false && guildId
          ? null // Query all server memories
          : guildId

      for (const memory of memories) {
        // Find MongoDB record by vectorId and update
        const mongoMemory = await getUserMemories(
          userId,
          mongoQueryGuildId,
          100
        )
        const match = mongoMemory.find(m => m.vectorId === memory.id)
        if (match) {
          await updateMemoryAccess(match._id.toString())
          memory.context = match.context
        }
      }

      logger.debug(`Recalled ${memories.length} memories for user ${userId}`)
      return memories
    } catch (error: any) {
      logger.error(`Failed to recall memories: ${error.message}`, error)
      return []
    }
  }

  /**
   * Delete all memories for a user
   */
  async forgetUser(userId: string, guildId: string | null): Promise<number> {
    if (!this.upstashIndex) return 0

    try {
      // Get all memories from MongoDB
      const memories = await getUserMemories(userId, guildId, 1000)

      // Delete from Upstash
      const vectorIds = memories.map(m => m.vectorId)
      if (vectorIds.length > 0) {
        await this.upstashIndex.delete(vectorIds)
      }

      // Delete from MongoDB
      const deletedCount = await deleteUserMemories(userId, guildId)

      logger.log(`Forgot ${deletedCount} memories for user ${userId}`)
      return deletedCount
    } catch (error: any) {
      logger.error(`Failed to forget user: ${error.message}`, error)
      return 0
    }
  }

  /**
   * Get all memories for a user (for /memories command)
   */
  async listUserMemories(
    userId: string,
    guildId: string | null
  ): Promise<any[]> {
    return await getUserMemories(userId, guildId, 50)
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalMemories: number
    uniqueUsers: number
    uniqueGuilds: number
    byType: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    avgImportance: number
    totalAccessCount: number
  }> {
    try {
      const rawStats = await getMemoryStats()

      // Transform byType from array to object
      const byType: Record<string, number> = {}
      if (rawStats.byType && Array.isArray(rawStats.byType)) {
        for (const item of rawStats.byType) {
          byType[item._id] = item.count
        }
      }

      // Transform topUsers
      const topUsers: Array<{ userId: string; count: number }> = []
      if (rawStats.topUsers && Array.isArray(rawStats.topUsers)) {
        for (const item of rawStats.topUsers) {
          topUsers.push({
            userId: item._id,
            count: item.count,
          })
        }
      }

      // Get additional stats
      const uniqueUsersResult = await Model.distinct('userId')
      const uniqueGuildsResult = await Model.distinct('guildId').then(guilds =>
        guilds.filter(g => g !== null)
      )

      // Get average importance and total access count
      const importanceStats = await Model.aggregate([
        {
          $group: {
            _id: null,
            avgImportance: { $avg: '$importance' },
            totalAccessCount: { $sum: '$accessCount' },
          },
        },
      ])

      const avgImportance = importanceStats[0]?.avgImportance || 0
      const totalAccessCount = importanceStats[0]?.totalAccessCount || 0

      return {
        totalMemories: rawStats.total || 0,
        uniqueUsers: uniqueUsersResult.length,
        uniqueGuilds: uniqueGuildsResult.length,
        byType,
        topUsers,
        avgImportance: Math.round(avgImportance * 100) / 100, // Round to 2 decimals
        totalAccessCount,
      }
    } catch (error: any) {
      logger.error(`Failed to get memory stats: ${error.message}`, error)
      return {
        totalMemories: 0,
        uniqueUsers: 0,
        uniqueGuilds: 0,
        byType: {},
        topUsers: [],
        avgImportance: 0,
        totalAccessCount: 0,
      }
    }
  }

  /**
   * Prune old memories
   */
  async pruneOldMemories(): Promise<number> {
    if (!this.upstashIndex) return 0

    try {
      // Get memories to prune from MongoDB
      const deleted = await pruneMemories({
        olderThanDays: 90,
        maxImportance: 3,
        maxAccessCount: 2,
      })

      logger.log(`Pruned ${deleted} old memories`)
      return deleted
    } catch (error: any) {
      logger.error(`Failed to prune memories: ${error.message}`, error)
      return 0
    }
  }
}

// Singleton instance
export const memoryService = new MemoryService()
