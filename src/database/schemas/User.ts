// @root/src/database/schemas/User.ts

import mongoose from 'mongoose'
import config from '../../config'
import FixedSizeMap from 'fixedsize-map'

const cache = new FixedSizeMap(config.CACHE_SIZE.USERS)

const FlagSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  flaggedBy: { type: String, required: true },
  flaggedAt: { type: Date, default: Date.now },
  serverId: { type: String, required: true },
  serverName: { type: String, required: true },
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
    reputation: {
      received: { type: Number, default: 0 },
      given: { type: Number, default: 0 },
      timestamp: Date,
    },
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
    },
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
    userDb = await Model.create({
      _id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      flags: [],
    })
  }

  cache.add(user.id, userDb)
  return userDb
}

export async function addFlag(
  userId: string,
  reason: string,
  flaggedBy: string,
  serverId: string,
  serverName: string
) {
  const newFlag = {
    reason,
    flaggedBy,
    flaggedAt: new Date(),
    serverId,
    serverName,
  }
  const user = await Model.findByIdAndUpdate(
    userId,
    { $push: { flags: newFlag } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function removeFlag(userId: string, flaggedBy: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $pull: { flags: { flaggedBy } } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function removeAllFlags(userId: string) {
  const user = await Model.findByIdAndUpdate(
    userId,
    { $set: { flags: [] } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
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

  if (user) cache.add(userId, user)
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

  if (user) cache.add(userId, user)
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

  if (user) cache.add(userId, user)
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

  if (user) cache.add(userId, user)
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

  if (user) cache.add(userId, user)
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

  if (user) cache.add(userId, user)
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
          },
        },
      },
    },
    { new: true }
  )

  if (user) cache.add(userId, user)
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
    const birthdate = new Date(user.profile.birthdate)
    return (
      birthdate.getDate() === today.getDate() &&
      birthdate.getMonth() === today.getMonth()
    )
  })
}

export async function getReputationLb(limit: number = 10): Promise<any[]> {
  return Model.find({
    'reputation.received': { $exists: true, $gt: 0 },
  })
    .limit(limit)
    .sort({ 'reputation.received': -1 })
    .select('_id reputation.received')
    .lean()
    .then(users =>
      users.map(user => ({
        member_id: user._id,
        rep: user.reputation?.received || 0,
      }))
    )
}

// Default export for backwards compatibility
export default {
  getUser,
  addFlag,
  removeFlag,
  removeAllFlags,
  updatePremium,
  setAfk,
  removeAfk,
  calculateAge,
  updateBasicProfile,
  updateMiscProfile,
  updateProfile,
  clearProfile,
  getUsersWithBirthdayToday,
  getReputationLb,
}
