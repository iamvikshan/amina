// @root/src/database/schemas/AiMemory.ts

import mongoose from 'mongoose'

// REQUIRED: Create Atlas Vector Search index on the 'aimemories' collection:
// {
//   "fields": [
//     { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
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
          (v.length === 768 && v.every(n => Number.isFinite(n))),
        message:
          'Embedding must be empty or exactly 768 finite numbers (NaN/Infinity not allowed)',
      },
    }, // 768-dimension vector for Atlas Vector Search
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

// Delete oldest memories for a user (by creation date, keeping most important)
export async function deleteOldestMemories(
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
