// @root/src/services/ai/memoryService.ts

import OpenAI from 'openai'
import Logger from '@helpers/Logger'
import {
  saveMemory,
  getUserMemories,
  deleteUserMemories,
  getMemoryStats,
  pruneMemories,
  getUserMemoryCount,
  pruneLeastImportantMemories,
  vectorSearch,
  findSimilarMemory,
  Model,
} from '@schemas/AiMemory'

const logger = Logger

// MemoryFact and RecalledMemory are now globally available - see types/services.d.ts

export class MemoryService {
  private gemini: OpenAI | null = null
  private mistral: OpenAI | null = null
  private voyageNative: OpenAI | null = null
  private voyageMongo: OpenAI | null = null
  private embeddingModel: string = 'voyage-4-lite'
  private dedupThreshold: number = 0.85
  private readonly MAX_MEMORIES_PER_USER = 50

  async initialize(options: {
    geminiApiKey?: string
    mistralApiKey?: string
    voyageApiKey?: string
    voyageMongoApiKey?: string
    embeddingModel?: string
    dedupThreshold?: number
  }) {
    try {
      this.gemini = options.geminiApiKey
        ? new OpenAI({
            apiKey: options.geminiApiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          })
        : null
      this.mistral = options.mistralApiKey
        ? new OpenAI({
            apiKey: options.mistralApiKey,
            baseURL: 'https://api.mistral.ai/v1',
          })
        : null
      this.voyageNative = options.voyageApiKey
        ? new OpenAI({
            apiKey: options.voyageApiKey,
            baseURL: 'https://api.voyageai.com/v1',
          })
        : null
      this.voyageMongo = options.voyageMongoApiKey
        ? new OpenAI({
            apiKey: options.voyageMongoApiKey,
            baseURL: 'https://ai.mongodb.com/v1',
          })
        : null
      if (options.embeddingModel) this.embeddingModel = options.embeddingModel
      if (options.dedupThreshold !== undefined)
        this.dedupThreshold = options.dedupThreshold
      logger.success('Memory Service initialized')
    } catch (error: any) {
      logger.error(
        `Failed to initialize Memory Service: ${error.message}`,
        error
      )
    }
  }

  /**
   * Generate an embedding via Voyage AI (dual-key random selection), Gemini, or Mistral (fallback).
   * @param text
   * @param inputType
   */
  private async generateVoyageOrFallbackEmbedding(
    text: string,
    inputType?: 'query' | 'document'
  ): Promise<number[] | null> {
    // Build ordered Voyage client list with random primary selection
    const voyageClients: { client: OpenAI; label: string }[] = []
    if (this.voyageNative)
      voyageClients.push({ client: this.voyageNative, label: 'Voyage native' })
    if (this.voyageMongo)
      voyageClients.push({ client: this.voyageMongo, label: 'Voyage MongoDB' })
    // Randomize order when both are available
    if (voyageClients.length === 2 && Math.random() < 0.5)
      voyageClients.reverse()

    for (const { client, label } of voyageClients) {
      try {
        const params: OpenAI.EmbeddingCreateParams & {
          input_type?: string
        } = {
          model: this.embeddingModel,
          input: [text],
        }
        if (inputType) params.input_type = inputType
        const result = await client.embeddings.create(params)
        const embedding = result.data?.[0]?.embedding
        if (embedding?.length) {
          logger.debug(
            `Embedding generated via ${label} (${embedding.length}d)`
          )
          return embedding
        }
      } catch (err: any) {
        logger.warn(`${label} embedding error: ${err.message}`)
      }
    }

    if (this.gemini) {
      try {
        const result = await this.gemini.embeddings.create({
          model: 'gemini-embedding-001',
          input: [text],
          dimensions: 1024,
        })
        const embedding = result.data?.[0]?.embedding
        if (embedding?.length) {
          logger.debug(
            `Embedding generated via Gemini fallback (${embedding.length}d)`
          )
          return embedding
        }
      } catch (err: any) {
        logger.warn(`Gemini embedding fallback failed: ${err.message}`)
      }
    }

    if (this.mistral) {
      try {
        const result = await this.mistral.embeddings.create({
          model: 'mistral-embed',
          input: [text],
        })
        const embedding = result.data?.[0]?.embedding
        if (embedding?.length) {
          logger.debug(
            `Embedding generated via Mistral fallback (${embedding.length}d)`
          )
          return embedding
        }
      } catch (err: any) {
        logger.warn(`Mistral embedding fallback failed: ${err.message}`)
      }
    }

    return null
  }

  /**
   * Store a memory in MongoDB with its embedding vector
   * @param fact
   * @param userId
   * @param guildId
   * @param context
   */
  async storeMemory(
    fact: MemoryFact,
    userId: string,
    guildId: string | null,
    context: string
  ): Promise<boolean> {
    if (
      !this.voyageNative &&
      !this.voyageMongo &&
      !this.gemini &&
      !this.mistral
    ) {
      logger.warn(
        'storeMemory skipped: Memory Service not initialized (AI client missing)'
      )
      return false
    }

    try {
      const embeddingText = `${fact.key}: ${fact.value}`
      const embedding = await this.generateVoyageOrFallbackEmbedding(
        embeddingText,
        'document'
      )
      if (!embedding) {
        logger.warn('Failed to generate embedding: no provider returned values')
        return false
      }

      // Semantic deduplication: check for similar existing memory (best-effort)
      if (this.dedupThreshold > 0) {
        try {
          const memoryType = fact.memoryType || 'user'
          const existing = await findSimilarMemory(
            embedding,
            userId,
            guildId,
            memoryType
          )
          if (existing && existing.score >= this.dedupThreshold) {
            // Merge: update existing memory with newest value, average importance, update context
            const mergedImportance = Math.max(
              1,
              Math.min(
                10,
                Math.round((existing.importance + fact.importance) / 2)
              )
            )
            await Model.findByIdAndUpdate(
              existing._id,
              {
                $set: {
                  value: fact.value,
                  context,
                  importance: mergedImportance,
                  embedding,
                  lastAccessedAt: new Date(),
                },
                $inc: { accessCount: 1 },
              },
              { runValidators: true }
            )
            logger.debug(
              `Merged memory "${fact.key}" (score: ${existing.score.toFixed(3)}) for user ${userId}`
            )
            return true
          }
        } catch (dedupError: any) {
          // Dedup is best-effort — if vector search fails, fall through to normal insert
          logger.debug(
            `Dedup check failed, proceeding with insert: ${dedupError.message}`
          )
        }
      }

      // Store everything in MongoDB (including embedding vector)
      await saveMemory({
        userId,
        guildId,
        memoryType: fact.memoryType || 'user',
        key: fact.key,
        value: fact.value,
        context,
        importance: fact.importance,
        embedding,
      })

      // Check memory limit and delete oldest if exceeded
      const currentCount = await getUserMemoryCount(userId, guildId)
      if (currentCount > this.MAX_MEMORIES_PER_USER) {
        const { deletedCount } = await pruneLeastImportantMemories(
          userId,
          guildId,
          this.MAX_MEMORIES_PER_USER
        )
        if (deletedCount > 0) {
          logger.debug(
            `Pruned ${deletedCount} least-important memories for user ${userId} (context: ${guildId || 'DM'})`
          )
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
   * Recall relevant memories for a message.
   * Note: when post-filtering is needed (server context with global memories but not combining DM),
   * the actual number of results may be less than the requested limit due to Atlas filter limitations.
   * @param userMessage
   * @param userId
   * @param guildId
   * @param limit
   * @param userPrefs
   * @param userPrefs.combineDmWithServer
   * @param userPrefs.globalServerMemories
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
    if (
      !this.voyageNative &&
      !this.voyageMongo &&
      !this.gemini &&
      !this.mistral
    ) {
      logger.warn(
        'recallMemories skipped: Memory Service not initialized (AI client missing)'
      )
      return []
    }

    try {
      const queryVector = await this.generateVoyageOrFallbackEmbedding(
        userMessage,
        'query'
      )
      if (!queryVector) {
        logger.warn(
          'Failed to generate query embedding: no provider returned values'
        )
        return []
      }

      // Build filter for Atlas Vector Search
      const filter: Record<string, unknown> = { userId }

      if (guildId) {
        // Server context
        if (userPrefs?.combineDmWithServer) {
          // Allow both server AND DM memories
          if (userPrefs?.globalServerMemories !== false) {
            // Global server + DM: no guildId filter (just userId)
          } else {
            // Per-server + DM
            filter.guildId = { $in: [guildId, null] }
          }
        } else {
          // ONLY server memories (strict)
          if (userPrefs?.globalServerMemories !== false) {
            // Global server: exclude DM (guildId must not be null)
            // Atlas $vectorSearch filter doesn't support $ne, so we skip guildId filter
            // and rely on the data — most memories will have a guildId set
          } else {
            // Per-server only
            filter.guildId = guildId
          }
        }
      } else {
        // DM context
        if (userPrefs?.combineDmWithServer) {
          // Allow both DM AND server memories: no guildId filter
        } else {
          // ONLY DM memories (strict)
          filter.guildId = null
        }
      }

      // Use Atlas Vector Search — overfetch to compensate for post-filtering
      const needsPostFilter =
        guildId &&
        userPrefs?.globalServerMemories !== false &&
        !userPrefs?.combineDmWithServer
      const fetchSize = needsPostFilter
        ? Math.max(limit * 2, limit + 10) // Overfetch to compensate for post-filtering; +10 is a best-effort heuristic fallback due to Atlas $vectorSearch filter limitations
        : limit
      let results = await vectorSearch(queryVector, filter, fetchSize)

      // Post-filter: when in server context with global memories but NOT combining DM,
      // exclude DM memories (guildId === null) that may have slipped through
      if (needsPostFilter) {
        results = results.filter(r => r.guildId != null)
        const finalCount = results.length
        if (finalCount < limit) {
          logger.debug(
            `Post-filtering reduced results: limit=${limit}, fetchSize=${fetchSize}, finalCount=${finalCount}`
          )
        }
      }

      // Trim back to requested limit after post-filtering
      results = results.slice(0, limit)

      const memories: RecalledMemory[] = results.map(r => ({
        id: r._id,
        key: r.key,
        value: r.value,
        score: r.score,
        context: r.context,
      }))

      // Bulk update access tracking
      if (memories.length > 0) {
        const ids = results.map(r => r._id)
        await Model.updateMany(
          { _id: { $in: ids } },
          {
            $set: { lastAccessedAt: new Date() },
            $inc: { accessCount: 1 },
          }
        )
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
   * @param userId
   * @param guildId
   */
  async forgetUser(userId: string, guildId: string | null): Promise<number> {
    try {
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
   * @param userId
   * @param guildId
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
    try {
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

  /**
   * Generate an embedding vector for the given text.
   * @param text
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (
      !this.voyageNative &&
      !this.voyageMongo &&
      !this.gemini &&
      !this.mistral
    ) {
      logger.warn(
        'generateEmbedding skipped: Memory Service not initialized (AI client missing)'
      )
      return null
    }
    return this.generateVoyageOrFallbackEmbedding(text)
  }

  /**
   * Find and update an existing memory that semantically matches the description.
   * @param description
   * @param newValue
   * @param userId
   * @param guildId
   * @param memoryType
   */
  async updateMemoryByMatch(
    description: string,
    newValue: string,
    userId: string,
    guildId: string | null,
    memoryType: string = 'user'
  ): Promise<{ found: boolean; oldValue?: string; newValue?: string }> {
    const embedding = await this.generateEmbedding(description)
    if (!embedding) return { found: false }

    try {
      const existing = await findSimilarMemory(
        embedding,
        userId,
        guildId,
        memoryType
      )
      if (!existing || existing.score < this.dedupThreshold) {
        return { found: false }
      }

      const oldValue = existing.value
      await Model.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            value: newValue,
            lastAccessedAt: new Date(),
          },
          $inc: { accessCount: 1 },
        },
        { runValidators: true }
      )

      logger.debug(
        `Updated memory "${existing.key}" for user ${userId} (score: ${existing.score.toFixed(3)})`
      )
      return { found: true, oldValue, newValue }
    } catch (error: any) {
      logger.error(`Failed to update memory by match: ${error.message}`)
      return { found: false }
    }
  }

  /**
   * Find and delete an existing memory that semantically matches the description.
   * @param description
   * @param userId
   * @param guildId
   * @param memoryType
   */
  async deleteMemoryByMatch(
    description: string,
    userId: string,
    guildId: string | null,
    memoryType: string = 'user'
  ): Promise<{ found: boolean; deletedValue?: string }> {
    const embedding = await this.generateEmbedding(description)
    if (!embedding) return { found: false }

    try {
      const existing = await findSimilarMemory(
        embedding,
        userId,
        guildId,
        memoryType
      )
      if (!existing || existing.score < this.dedupThreshold) {
        return { found: false }
      }

      const deletedValue = existing.value
      await Model.findByIdAndDelete(existing._id)

      logger.debug(
        `Deleted memory "${existing.key}" for user ${userId} (score: ${existing.score.toFixed(3)})`
      )
      return { found: true, deletedValue }
    } catch (error: any) {
      logger.error(`Failed to delete memory by match: ${error.message}`)
      return { found: false }
    }
  }
}

// Singleton instance
export const memoryService = new MemoryService()
