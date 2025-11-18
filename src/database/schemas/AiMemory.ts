// @root/src/database/schemas/AiMemory.ts

import mongoose from 'mongoose'

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
    vectorId: { type: String, required: true, unique: true }, // Upstash vector ID
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
// Returns object with deletedCount and vectorIds for Upstash deletion
export async function deleteOldestMemories(
  userId: string,
  guildId: string | null,
  keepCount: number
): Promise<{ deletedCount: number; vectorIds: string[] }> {
  // Get all memories sorted by importance (desc) then createdAt (asc)
  const allMemories = await Model.find({ userId, guildId })
    .sort({ importance: -1, createdAt: 1 })
    .lean()

  if (allMemories.length <= keepCount) {
    return { deletedCount: 0, vectorIds: [] } // No deletion needed
  }

  // Keep the top N by importance, delete the rest
  const toDelete = allMemories.slice(keepCount)
  const vectorIds = toDelete.map(m => m.vectorId)

  // Delete from MongoDB
  const result = await Model.deleteMany({
    _id: { $in: toDelete.map(m => m._id) },
  })

  return {
    deletedCount: result.deletedCount || 0,
    vectorIds, // Return vectorIds for Upstash deletion
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
