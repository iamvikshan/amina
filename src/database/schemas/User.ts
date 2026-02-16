// @root/src/database/schemas/User.ts

import mongoose from 'mongoose'
import config from '../../config'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({ max: config.CACHE_SIZE.USERS })

const FlagSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  flaggedBy: { type: String, required: true },
  flaggedAt: { type: Date, default: Date.now },
  serverId: { type: String, required: true },
  serverName: { type: String, required: true },
  actionType: { type: String, default: null }, // BAN, KICK, TIMEOUT, etc. or null for user-generated
})

const ProfileSchema = new mongoose.Schema({
  pronouns: { type: String, default: null },
  birthdate: { type: Date, default: null },
  age: { type: Number, default: null },
  region: { type: String, default: null },
  languages: [{ type: String }],
  timezone: { type: String, default: null },
  bio: { type: String, default: null, maxLength: 1000 },
  interests: [{ type: String }],
  socials: { type: Map, of: String, default: new Map() },
  favorites: { type: Map, of: String, default: new Map() },
  goals: [{ type: String }],
  privacy: {
    showAge: { type: Boolean, default: true },
    showRegion: { type: Boolean, default: true },
    showBirthdate: { type: Boolean, default: false },
    showPronouns: { type: Boolean, default: true },
    showAiStats: { type: Boolean, default: true },
  },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

const Schema = new mongoose.Schema(
  {
    _id: String,
    username: String,
    discriminator: String,
    logged: { type: Boolean, default: false },
    coins: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    daily: { streak: { type: Number, default: 0 }, timestamp: Date },
    flags: { type: [FlagSchema], default: [] },
    premium: {
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
    afk: {
      enabled: { type: Boolean, default: false },
      reason: { type: String, default: null },
      since: { type: Date, default: null },
      endTime: { type: Date, default: null },
    },
    profile: { type: ProfileSchema, default: () => ({}) },
    minaAi: {
      ignoreMe: { type: Boolean, default: false },
      allowDMs: { type: Boolean, default: true },
      combineDmWithServer: { type: Boolean, default: false },
      globalServerMemories: { type: Boolean, default: true },
      stats: {
        messages: { type: Number, default: 0 },
        tokensUsed: { type: Number, default: 0 },
        toolCalls: { type: Number, default: 0 },
        memoriesCreated: { type: Number, default: 0 },
        lastInteraction: { type: Date, default: null },
      },
    },
    todRating: { type: String, enum: ['PG', 'PG-16', 'R'], default: null },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

const Model = mongoose.model('user', Schema)

export async function getUser(user: any) {
  if (!user) throw new Error('User is required.')
  if (!user.id) throw new Error('User Id is required.')

  const cached = cache.get(user.id)
  if (cached) return cached

  let userDb = await Model.findById(user.id)
  if (!userDb) {
    const newUser = new Model({
      _id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      flags: [],
    })
    userDb = await newUser.save()
  }

  cache.set(user.id, userDb)
  return userDb
}

const MAX_FLAGS = 10

export async function addFlag(
  userId: string,
  reason: string,
  flaggedBy: string,
  serverId: string,
  serverName: string,
  actionType: string | null = null
) {
  // Get current user to check flag count
  const currentUser = await Model.findById(userId)
  const currentFlags =
    (currentUser && Array.isArray(currentUser.flags)
      ? (currentUser.flags as any[])
      : []) || []

  // If at max, remove oldest flag (FIFO)
  if (currentFlags.length >= MAX_FLAGS) {
    // Sort by flaggedAt and remove the oldest
    const sortedFlags = [...currentFlags].sort(
      (a: any, b: any) =>
        new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime()
    )
    const oldestFlag = sortedFlags[0]

    // Remove the oldest flag
    await Model.findByIdAndUpdate(
      userId,
      { $pull: { flags: { _id: oldestFlag._id } } },
      { new: true }
    )
  }

  const newFlag = {
    reason,
    flaggedBy,
    flaggedAt: new Date(),
    serverId,
    serverName,
    actionType,
  }
  const user = await Model.findByIdAndUpdate(
    userId,
    { $push: { flags: newFlag } },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function removeFlag(userId: string, flaggedBy: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $pull: { flags: { flaggedBy } } },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function removeAllFlags(userId: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $set: { flags: [] } },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

/**
 * Remove flags from a specific server only
 */
export async function removeFlagsByServer(userId: string, serverId: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $pull: { flags: { serverId } } },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

/**
 * Add a flag from a moderation action
 * Formats the reason as "{actionType} by {issuerDisplayName}: {reason}" or "{actionType} by {issuerDisplayName}: No reason provided"
 */
export async function addFlagFromModAction(
  userId: string,
  reason: string | null,
  flaggedBy: string,
  flaggedByDisplayName: string,
  serverId: string,
  serverName: string,
  actionType: string
) {
  const formattedReason = reason
    ? `${actionType} by ${flaggedByDisplayName}: ${reason}`
    : `${actionType} by ${flaggedByDisplayName}: No reason provided`

  return addFlag(
    userId,
    formattedReason,
    flaggedBy,
    serverId,
    serverName,
    actionType
  )
}

export async function updatePremium(
  userId: string,
  enabled: boolean,
  expiresAt: Date | null
) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $set: { 'premium.enabled': enabled, 'premium.expiresAt': expiresAt } },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function setAfk(
  userId: string,
  reason: string | null = null,
  duration: number | null = null
) {
  const since = new Date()
  const endTime = duration ? new Date(since.getTime() + duration * 60000) : null
  const user = await Model.findByIdAndUpdate(
    userId,
    {
      $set: {
        'afk.enabled': true,
        'afk.reason': reason,
        'afk.since': since,
        'afk.endTime': endTime,
      },
    },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function removeAfk(userId: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    {
      $set: {
        'afk.enabled': false,
        'afk.reason': null,
        'afk.since': null,
        'afk.endTime': null,
      },
    },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export function calculateAge(birthdate: Date | null): number | null {
  if (!birthdate) return null
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  )
    age--
  return age
}

export async function updateBasicProfile(userId: string, basicData: any) {
  const updateData: any = {}
  if (basicData.pronouns !== undefined)
    updateData['profile.pronouns'] = basicData.pronouns
  if (basicData.birthdate) {
    updateData['profile.birthdate'] = new Date(basicData.birthdate)
    updateData['profile.age'] = calculateAge(new Date(basicData.birthdate))
  }
  if (basicData.region !== undefined)
    updateData['profile.region'] = basicData.region
  if (basicData.languages) updateData['profile.languages'] = basicData.languages
  if (basicData.timezone !== undefined)
    updateData['profile.timezone'] = basicData.timezone
  updateData['profile.lastUpdated'] = new Date()
  const user = await Model.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function updateMiscProfile(userId: string, miscData: any) {
  const updateData: any = {}
  if (miscData.bio !== undefined) updateData['profile.bio'] = miscData.bio
  if (miscData.interests) updateData['profile.interests'] = miscData.interests
  if (miscData.socials) updateData['profile.socials'] = miscData.socials
  if (miscData.favorites) updateData['profile.favorites'] = miscData.favorites
  if (miscData.goals) updateData['profile.goals'] = miscData.goals
  updateData['profile.lastUpdated'] = new Date()
  const user = await Model.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function updateProfile(userId: string, profileData: any) {
  const updateData: any = {}
  Object.entries(profileData).forEach(([key, value]) => {
    if (value !== undefined) updateData[`profile.${key}`] = value
  })
  if (profileData.birthdate) {
    const birthDate = new Date(profileData.birthdate)
    updateData['profile.birthdate'] = birthDate
    updateData['profile.age'] = calculateAge(birthDate)
  }
  updateData['profile.lastUpdated'] = new Date()
  const user = await Model.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function clearProfile(userId: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    {
      $set: {
        profile: {
          pronouns: null,
          age: null,
          region: null,
          timezone: null,
          bio: null,
          birthdate: null,
          interests: [],
          customFields: [],
          privacy: {
            showAge: false,
            showRegion: false,
            showBirthdate: false,
            showPronouns: false,
            showAiStats: false,
          },
        },
      },
    },
    { new: true }
  )

  if (user) cache.set(userId, user)
  return user
}

export async function getUsersWithBirthdayToday() {
  const today = new Date()
  const users = await Model.find({
    'profile.birthdate': {
      $exists: true,
      $ne: null,
    },
  })

  return users.filter(user => {
    const birthdate = new Date((user.profile as any).birthdate)
    return (
      birthdate.getDate() === today.getDate() &&
      birthdate.getMonth() === today.getMonth()
    )
  })
}

export async function updateUserMinaAiPreferences(
  userId: string,
  preferences: any
) {
  const updateFields: Record<string, any> = {}
  if (preferences.ignoreMe !== undefined)
    updateFields['minaAi.ignoreMe'] = preferences.ignoreMe
  if (preferences.allowDMs !== undefined)
    updateFields['minaAi.allowDMs'] = preferences.allowDMs
  if (preferences.combineDmWithServer !== undefined)
    updateFields['minaAi.combineDmWithServer'] = preferences.combineDmWithServer
  if (preferences.globalServerMemories !== undefined)
    updateFields['minaAi.globalServerMemories'] =
      preferences.globalServerMemories

  if (Object.keys(updateFields).length === 0) return null

  const user = await Model.findOneAndUpdate(
    { _id: userId },
    { $set: updateFields },
    { returnDocument: 'after' }
  )
  if (user) cache.set(userId, user)
  return user
}

// Default export for backwards compatibility
export default {
  Model,
  getUser,
  addFlag,
  removeFlag,
  removeAllFlags,
  removeFlagsByServer,
  addFlagFromModAction,
  updatePremium,
  setAfk,
  removeAfk,
  calculateAge,
  updateBasicProfile,
  updateMiscProfile,
  updateProfile,
  clearProfile,
  getUsersWithBirthdayToday,
  updateUserMinaAiPreferences,
}
