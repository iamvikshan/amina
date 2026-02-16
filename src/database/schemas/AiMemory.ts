// @root/src/database/schemas/AiMemory.ts

import mongoose from 'mongoose'

// REQUIRED: Create Atlas Vector Search index on the 'aimemories' collection:
// {
//   "fields": [
//     { "type": "vector", "path": "embedding", "numDimensions": 3072, "similarity": "cosine" },
//     { "type": "filter", "path": "userId" },
//     { "type": "filter", "path": "guildId" },
//     { "type": "filter", "path": "memoryType" }
//   ]
// }

const Schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, default: null, index: true },
    memoryType: {
      type: String,
      enum: ['user', 'guild', 'topic'],
      default: 'user',
      index: true,
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    context: { type: String, default: '' }, // Snippet of conversation
    importance: { type: Number, default: 5, min: 1, max: 10 },
    embedding: {
      type: [Number],
      default: [],
      validate: {
        validator: (v: number[]) =>
          v.length === 0 ||
          (v.length === 3072 && v.every(n => Number.isFinite(n))),
        message:
          'Embedding must be empty or exactly 3072 finite numbers (NaN/Infinity not allowed)',
      },
    }, // 3072-dimension vector for Atlas Vector Search
    lastAccessedAt: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient queries
Schema.index({ userId: 1, guildId: 1, memoryType: 1 })
Schema.index({ guildId: 1, importance: -1 })
Schema.index({ lastAccessedAt: 1 }) // For pruning

export const Model = mongoose.model('ai-memory', Schema)

// Drop orphan vectorId_1 index left from pre-Phase 4 schema
// This is a one-time cleanup; once the index is gone, the catch branch runs harmlessly
// TODO: Remove after first production run
void Model.collection.dropIndex('vectorId_1').catch(() => {
  // Index doesn't exist (already cleaned up) — safe to ignore
})

// Get memories for a user in a specific context
export async function getUserMemories(
  userId: string,
  guildId: string | null,
  limit = 50
): Promise<any[]> {
  return await Model.find({ userId, guildId })
    .sort({ importance: -1, lastAccessedAt: -1 })
    .limit(limit)
    .lean()
}

// Get all guild-wide memories
export async function getGuildMemories(
  guildId: string,
  limit = 50
): Promise<any[]> {
  return await Model.find({ guildId, memoryType: 'guild' })
    .sort({ importance: -1, lastAccessedAt: -1 })
    .limit(limit)
    .lean()
}

// Save a new memory
export async function saveMemory(memoryData: any): Promise<any> {
  const memory = new Model(memoryData)
  return await memory.save()
}

// Update memory access tracking
export async function updateMemoryAccess(memoryId: string): Promise<void> {
  await Model.findByIdAndUpdate(memoryId, {
    $set: { lastAccessedAt: new Date() },
    $inc: { accessCount: 1 },
  })
}

// Delete memories for a user
export async function deleteUserMemories(
  userId: string,
  guildId: string | null
): Promise<number> {
  const result = await Model.deleteMany({ userId, guildId })
  return result.deletedCount || 0
}

// Get count of memories for a user in a context
export async function getUserMemoryCount(
  userId: string,
  guildId: string | null
): Promise<number> {
  return await Model.countDocuments({ userId, guildId })
}

// Prune least important memories for a user, keeping the top N by importance
export async function pruneLeastImportantMemories(
  userId: string,
  guildId: string | null,
  keepCount: number
): Promise<{ deletedCount: number }> {
  // Get all memories sorted by importance (desc) then createdAt (asc)
  const allMemories = await Model.find({ userId, guildId })
    .sort({ importance: -1, createdAt: 1 })
    .lean()

  if (allMemories.length <= keepCount) {
    return { deletedCount: 0 } // No deletion needed
  }

  // Keep the top N by importance, delete the rest
  const toDelete = allMemories.slice(keepCount)

  // Delete from MongoDB
  const result = await Model.deleteMany({
    _id: { $in: toDelete.map(m => m._id) },
  })

  return {
    deletedCount: result.deletedCount || 0,
  }
}

// Get memory statistics
export async function getMemoryStats(): Promise<any> {
  const total = await Model.countDocuments()
  const byType = await Model.aggregate([
    { $group: { _id: '$memoryType', count: { $sum: 1 } } },
  ])
  const topUsers = await Model.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])

  return { total, byType, topUsers }
}

// Prune old, unimportant memories
export async function pruneMemories(options: {
  olderThanDays: number
  maxImportance: number
  maxAccessCount: number
}): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays)

  const result = await Model.deleteMany({
    lastAccessedAt: { $lt: cutoffDate },
    importance: { $lte: options.maxImportance },
    accessCount: { $lte: options.maxAccessCount },
  })

  return result.deletedCount || 0
}

/**
 * Apply importance decay to memories not accessed within the decay period.
 * Memories lose 1 importance per decay period (default: 30 days).
 * Importance floors at 1 (never auto-deleted by decay alone).
 *
 * @param decayPeriodDays - Number of days of inactivity before decay (default: 30)
 * @returns Number of memories that had their importance reduced
 */
export async function applyImportanceDecay(
  decayPeriodDays = 30
): Promise<number> {
  if (decayPeriodDays <= 0) return 0

  const now = new Date()
  const decayPeriodMs = decayPeriodDays * 24 * 60 * 60 * 1000

  // Find memories not accessed within the decay period and with importance > 1
  const cutoff = new Date(now.getTime() - decayPeriodMs)
  const candidates = await Model.find({
    lastAccessedAt: { $lt: cutoff },
    importance: { $gt: 1 },
  }).lean()

  if (candidates.length === 0) return 0

  // Build bulk operations to avoid N+1 writes
  const bulkOps: Array<{
    updateOne: {
      filter: { _id: unknown }
      update: { $set: { importance: number } }
    }
  }> = []

  for (const memory of candidates) {
    const elapsed = now.getTime() - new Date(memory.lastAccessedAt).getTime()
    const periods = Math.floor(elapsed / decayPeriodMs)
    if (periods < 1) continue

    const newImportance = Math.max(1, memory.importance - periods)
    if (newImportance < memory.importance) {
      bulkOps.push({
        updateOne: {
          filter: { _id: memory._id },
          update: { $set: { importance: newImportance } },
        },
      })
    }
  }

  if (bulkOps.length === 0) return 0

  const result = await Model.bulkWrite(bulkOps)
  return result.modifiedCount
}

/**
 * Find the most similar existing memory for a user in a given context.
 * Used for semantic deduplication before storing new memories.
 * Scoped to the same userId + guildId + memoryType to prevent cross-category merges.
 * Returns the best match with its similarity score, or null if no match found.
 */
export async function findSimilarMemory(
  queryVector: number[],
  userId: string,
  guildId: string | null,
  memoryType: string
): Promise<{
  _id: any
  key: string
  value: string
  context: string
  importance: number
  score: number
} | null> {
  const filter: Record<string, unknown> = { userId, memoryType }

  if (guildId !== null) {
    // Guild-scoped: filter directly by guildId
    filter.guildId = guildId

    const results = await Model.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector,
          numCandidates: 20,
          limit: 1,
          filter,
        },
      },
      {
        $project: {
          _id: 1,
          key: 1,
          value: 1,
          context: 1,
          importance: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ])

    return results.length > 0 ? results[0] : null
  }

  // DM context (guildId === null): two-stage search
  // Stage 1: Try with $match post-filter for null guildId (small limit)
  const stage1 = await Model.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 20,
        limit: 10,
        filter, // userId + memoryType only (no guildId filter)
      },
    },
    { $match: { guildId: { $in: [null] } } },
    {
      $project: {
        _id: 1,
        key: 1,
        value: 1,
        context: 1,
        importance: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    { $limit: 1 },
  ])

  if (stage1.length > 0) return stage1[0]

  // Stage 2: Broader search with post-filter (fallback)
  const stage2 = await Model.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 200,
        limit: 200,
        filter,
      },
    },
    {
      $project: {
        _id: 1,
        key: 1,
        value: 1,
        context: 1,
        importance: 1,
        guildId: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ])

  const dmResults = stage2.filter(r => r.guildId == null)
  return dmResults.length > 0 ? dmResults[0] : null
}

/** Maximum numCandidates for Atlas Vector Search (prevents unbounded scans) */
const MAX_NUM_CANDIDATES = 1000

// NOTE: $vectorSearch is a MongoDB Atlas-only feature.
// This function will fail on standalone/replica-set MongoDB deployments.
export async function vectorSearch(
  queryVector: number[],
  filter: Record<string, unknown>,
  limit: number
): Promise<
  Array<{
    _id: any
    key: string
    value: string
    context: string
    importance: number
    guildId: string | null
    score: number
  }>
> {
  return await Model.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: Math.min(limit * 10, MAX_NUM_CANDIDATES),
        limit,
        filter,
      },
    },
    {
      $project: {
        _id: 1,
        key: 1,
        value: 1,
        context: 1,
        importance: 1,
        guildId: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ])
}

/** Expected embedding dimensionality (must match Atlas Vector Search index numDimensions) */
const EMBEDDING_DIMENSIONS = 3072

/**
 * Re-embed all existing memories using the provided embedding function.
 * Used when migrating to a new embedding model with different dimensions.
 * Processes memories sequentially within each batch to respect rate limits.
 *
 * @param embedFn - Function that takes text and returns an embedding vector
 * @param batchSize - Number of memories to process per batch (default: 25)
 * @param delayMs - Delay between batches in ms to respect rate limits (default: 1000)
 * @returns Statistics about the re-embedding operation
 */
export async function reEmbedAllMemories(
  embedFn: (text: string) => Promise<number[] | null>,
  batchSize = 25,
  delayMs = 1000
): Promise<{
  total: number
  updated: number
  failed: number
  skipped: number
}> {
  const stats = { total: 0, updated: 0, failed: 0, skipped: 0 }

  const cursor = Model.find({}).cursor({ batchSize })
  let batch: Array<{ _id: any; key: string; value: string }> = []

  for await (const doc of cursor) {
    stats.total++
    batch.push({ _id: doc._id, key: doc.key, value: doc.value })

    if (batch.length >= batchSize) {
      await processBatch(batch, embedFn, stats)
      batch = []
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
    }
  }

  // Process remaining
  if (batch.length > 0) {
    await processBatch(batch, embedFn, stats)
  }

  return stats
}

async function processBatch(
  batch: Array<{ _id: any; key: string; value: string }>,
  embedFn: (text: string) => Promise<number[] | null>,
  stats: { updated: number; failed: number; skipped: number }
): Promise<void> {
  for (const doc of batch) {
    try {
      const text = `${doc.key}: ${doc.value}`
      const embedding = await embedFn(text)
      if (!embedding) {
        stats.skipped++
        continue
      }
      // Validate dimensions match the expected size before writing
      if (
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every(Number.isFinite)
      ) {
        stats.failed++
        continue
      }
      await Model.updateOne(
        { _id: doc._id },
        { $set: { embedding } },
        { runValidators: true }
      )
      stats.updated++
    } catch {
      stats.failed++
    }
  }
}
