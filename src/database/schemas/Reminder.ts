// @root/src/database/schemas/Reminder.ts

import mongoose from 'mongoose'
import FixedSizeMap from 'fixedsize-map'
import config from '../../config'

const cache = new FixedSizeMap(config.CACHE_SIZE.USERS)

const Schema = new mongoose.Schema(
  {
    _id: String, // user_id:reminder_id format for unique identification
    user_id: { type: String, required: true, index: true },
    reminder_id: { type: Number, required: true }, // Sequential per user
    message: { type: String, required: true, maxlength: 500 },
    remind_at: { type: Date, required: true, index: true },
    created_at: { type: Date, default: Date.now },
    channel_id: { type: String, required: true }, // Where to notify (fallback if DM fails)
    guild_id: { type: String, default: null }, // null = created in DM
    notified: { type: Boolean, default: false, index: true },
    // TODO: Add recurring reminder support
    // repeat_interval: { type: String, default: null }, // e.g., "daily", "weekly", "1d", "1w"
    // repeat_until: { type: Date, default: null }, // Stop repeating after this date
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

// Compound index for scheduler queries
Schema.index({ remind_at: 1, notified: 1 })
Schema.index({ user_id: 1, reminder_id: 1 }, { unique: true })

const Model = mongoose.model('reminder', Schema)

/**
 * Get next reminder ID for a user
 */
async function getNextReminderId(userId: string): Promise<number> {
  const lastReminder = await Model.findOne({ user_id: userId })
    .sort({ reminder_id: -1 })
    .select('reminder_id')
    .lean()

  return lastReminder ? lastReminder.reminder_id + 1 : 1
}

/**
 * Create a new reminder
 */
export async function createReminder(
  userId: string,
  message: string,
  remindAt: Date,
  channelId: string,
  guildId: string | null = null
): Promise<any> {
  const reminderId = await getNextReminderId(userId)
  const _id = `${userId}:${reminderId}`

  const reminder = await Model.create({
    _id,
    user_id: userId,
    reminder_id: reminderId,
    message,
    remind_at: remindAt,
    channel_id: channelId,
    guild_id: guildId,
    notified: false,
  })

  cache.add(_id, reminder)
  return reminder
}

/**
 * Get all active reminders for a user
 */
export async function getUserReminders(
  userId: string,
  includeNotified: boolean = false
): Promise<any[]> {
  const query: any = { user_id: userId }
  if (!includeNotified) {
    query.notified = false
  }

  return Model.find(query).sort({ remind_at: 1 }).lean()
}

/**
 * Get a specific reminder by user ID and reminder ID
 */
export async function getReminder(
  userId: string,
  reminderId: number
): Promise<any> {
  const _id = `${userId}:${reminderId}`
  const cached = cache.get(_id)
  if (cached) return cached

  const reminder = await Model.findById(_id).lean()
  if (reminder) cache.add(_id, reminder)
  return reminder
}

/**
 * Update reminder message
 */
export async function updateReminderMessage(
  userId: string,
  reminderId: number,
  newMessage: string
): Promise<any> {
  const _id = `${userId}:${reminderId}`
  const reminder = await Model.findByIdAndUpdate(
    _id,
    { $set: { message: newMessage } },
    { new: true }
  ).lean()

  if (reminder) cache.add(_id, reminder)
  return reminder
}

/**
 * Update reminder time
 */
export async function updateReminderTime(
  userId: string,
  reminderId: number,
  newRemindAt: Date
): Promise<any> {
  const _id = `${userId}:${reminderId}`
  const reminder = await Model.findByIdAndUpdate(
    _id,
    { $set: { remind_at: newRemindAt } },
    { new: true }
  ).lean()

  if (reminder) cache.add(_id, reminder)
  return reminder
}

/**
 * Mark reminder as notified
 */
export async function markReminderNotified(
  userId: string,
  reminderId: number
): Promise<any> {
  const _id = `${userId}:${reminderId}`
  const reminder = await Model.findByIdAndUpdate(
    _id,
    { $set: { notified: true } },
    { new: true }
  ).lean()

  if (reminder) cache.add(_id, reminder)
  return reminder
}

/**
 * Delete a reminder
 */
export async function deleteReminder(
  userId: string,
  reminderId: number
): Promise<boolean> {
  const _id = `${userId}:${reminderId}`
  const result = await Model.findByIdAndDelete(_id)
  cache.delete(_id)
  return !!result
}

/**
 * Delete all reminders for a user
 */
export async function deleteAllUserReminders(userId: string): Promise<number> {
  const result = await Model.deleteMany({ user_id: userId })
  // Clear cache entries for this user
  const keysToDelete: string[] = []
  for (const [key] of cache.entries()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
  return result.deletedCount || 0
}

/**
 * Get all due reminders (for scheduler)
 */
export async function getDueReminders(): Promise<any[]> {
  return Model.find({
    remind_at: { $lte: new Date() },
    notified: false,
  })
    .sort({ remind_at: 1 })
    .lean()
}

/**
 * Get reminder count for a user
 */
export async function getUserReminderCount(
  userId: string,
  includeNotified: boolean = false
): Promise<number> {
  const query: any = { user_id: userId }
  if (!includeNotified) {
    query.notified = false
  }
  return Model.countDocuments(query)
}

export default {
  createReminder,
  getUserReminders,
  getReminder,
  updateReminderMessage,
  updateReminderTime,
  markReminderNotified,
  deleteReminder,
  deleteAllUserReminders,
  getDueReminders,
  getUserReminderCount,
}
