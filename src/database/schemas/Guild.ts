// @root/src/database/schemas/Guild.ts

import mongoose from 'mongoose'
import config from '../../config'
import FixedSizeMap from 'fixedsize-map'
import { getUser } from './User'

const cache = new FixedSizeMap(config.CACHE_SIZE.GUILDS)

const Schema = new mongoose.Schema({
  _id: String,
  server: {
    name: String,
    region: String,
    owner: { type: String, ref: 'users' },
    joinedAt: Date,
    leftAt: Date,
    bots: { type: Number, default: 0 },
    updates_channel: { type: String, default: null },
    staff_roles: [String],
    setup_completed: { type: Boolean, default: false },
    setup_message_id: { type: String, default: null },
    did_setup_reminder: { type: Boolean, default: false }, // Flag to track if reminder was sent
    invite_link: { type: String, default: null },
  },
  stats: {
    enabled: { type: Boolean, default: true },
    xp: {
      message: { type: String, default: config.STATS.DEFAULT_LVL_UP_MSG },
      channel: String,
    },
  },
  ticket: {
    log_channel: String,
    limit: { type: Number, default: 10 },
    category: { type: String, default: null },
    enabled: { type: Boolean, default: false },
    topics: [
      {
        _id: false,
        name: String,
      },
    ],
  },
  automod: {
    debug: Boolean,
    strikes: { type: Number, default: 10 },
    action: { type: String, default: 'TIMEOUT' },
    wh_channels: [String],
    anti_attachments: Boolean,
    anti_invites: Boolean,
    anti_links: Boolean,
    anti_spam: Boolean,
    anti_ghostping: Boolean,
    anti_massmention: Number,
    max_lines: Number,
  },
  invite: {
    tracking: { type: Boolean, default: true },
    ranks: [
      {
        invites: { type: Number, required: true },
        _id: { type: String, required: true },
      },
    ],
  },

  logs_channel: String,
  logs: {
    enabled: { type: Boolean, default: false },
    member: {
      message_edit: { type: Boolean, default: false },
      message_delete: { type: Boolean, default: false },
      role_changes: { type: Boolean, default: false },
    },
    channel: {
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    role: {
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },

  max_warn: {
    action: {
      type: String,
      enum: ['TIMEOUT', 'KICK', 'BAN'],
      default: 'KICK',
    },
    limit: { type: Number, default: 5 },
  },
  counters: [
    {
      _id: false,
      counter_type: String,
      name: String,
      channel_id: String,
    },
  ],
  welcome: {
    enabled: Boolean,
    channel: String,
    content: String,
    embed: {
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  farewell: {
    enabled: Boolean,
    channel: String,
    content: String,
    embed: {
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  autorole: String,
  suggestions: {
    enabled: Boolean,
    channel_id: String,
    approved_channel: String,
    rejected_channel: String,
  },
  aiResponder: {
    enabled: { type: Boolean, default: true },
    freeWillChannels: { type: [String], default: [] }, // Array of channel IDs (max 2 for regular guilds, unlimited for test)
    mentionOnly: { type: Boolean, default: true },
    allowDMs: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: null },
  },
})

export const Model = mongoose.model('guild', Schema)

/**
 * Get free-will channels from guild data
 */
function getFreeWillChannels(guildData: any): string[] {
  if (!guildData?.aiResponder) return []
  return guildData.aiResponder.freeWillChannels || []
}

/**
 * Delete guild from cache
 * FixedSizeMap doesn't have a delete method, but since it's an LRU cache,
 * the entry will naturally be evicted when the cache fills up.
 * The data is already deleted from the database, so the cache will become stale.
 * @param guildId - The guild ID to remove from cache
 */
export function deleteGuildFromCache(guildId: string): void {
  // FixedSizeMap is an LRU cache and doesn't have a delete method
  // The cache entry will naturally become stale since the DB record is deleted
  // and will be evicted when the cache fills up or replaced on next access
  // Attempt to remove if method exists (for future compatibility)
  if (typeof (cache as any).delete === 'function') {
    ;(cache as any).delete(guildId)
  }
  // Otherwise, the LRU cache will handle eviction naturally
}

export async function getSettings(guild: any) {
  if (!guild) throw new Error('Guild is undefined')
  if (!guild.id) throw new Error('Guild Id is undefined')

  const cached = cache.get(guild.id)
  if (cached) {
    return cached
  }

  let guildData = await Model.findById(guild.id)
  if (!guildData) {
    // save owner details
    guild
      .fetchOwner()
      .then(async (owner: any) => {
        const userDb = await getUser(owner)
        await userDb.save()
      })
      .catch(() => {})

    // create a new guild model
    guildData = new Model({
      _id: guild.id,
      server: {
        name: guild.name,
        region: guild.preferredLocale,
        owner: guild.ownerId,
        joinedAt: guild.joinedAt,
      },
    })

    await guildData.save()
  }

  cache.add(guild.id, guildData)
  return guildData
}

export async function updateSettings(guildId: string, settings: any) {
  if (settings.server && settings.server.staff_roles) {
    settings.server.staff_roles = Array.isArray(settings.server.staff_roles)
      ? settings.server.staff_roles
      : [settings.server.staff_roles]
  }

  // Check if a ticket message is set and update the enabled status
  if (settings.ticket && settings.ticket.message_id) {
    settings.ticket.enabled = true
  }

  const updatedSettings = await Model.findByIdAndUpdate(guildId, settings, {
    new: true,
  })
  cache.add(guildId, updatedSettings)
  return updatedSettings
}

export async function setInviteLink(guildId: string, inviteLink: string) {
  const updatedSettings = await Model.findByIdAndUpdate(
    guildId,
    { 'server.invite_link': inviteLink },
    { new: true }
  )
  cache.add(guildId, updatedSettings)
  return updatedSettings
}

// Default export for backwards compatibility
export default {
  getSettings,
  updateSettings,
  setInviteLink,
}
