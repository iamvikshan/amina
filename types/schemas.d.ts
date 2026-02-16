// Database schema type definitions

import type { Document } from 'mongoose'

declare global {
  interface IReminderDocument {
    _id: string
    user_id: string
    reminder_id: number
    message: string
    remind_at: Date
    created_at: Date
    channel_id: string
    guild_id: string | null
    notified: boolean
  }

  interface IGuildSettings extends Document {
    _id: string
    server: {
      name: string
      region: string
      owner: string
      joinedAt: Date
      leftAt?: Date
      bots: number
      updates_channel?: string
      staff_roles: string[]
      setup_completed: boolean
      setup_message_id?: string
      invite_link?: string
      did_setup_reminder?: boolean
    }
    stats: {
      enabled: boolean
      xp: {
        message: string
        channel?: string
      }
    }
    ticket: {
      log_channel?: string
      limit: number
      category?: string
      enabled: boolean
      topics: Array<{ name: string }>
    }
    automod: {
      debug?: boolean
      strikes: number
      action: string
      wh_channels: string[]
      anti_attachments?: boolean
      anti_invites?: boolean
      anti_links?: boolean
      anti_spam?: boolean
      anti_ghostping?: boolean
      anti_massmention?: number
      max_lines?: number
    }
    invite: {
      tracking: boolean
      ranks: Array<{
        invites: number
        _id: string
      }>
    }
    logs_channel?: string
    logs: {
      enabled: boolean
      member: {
        message_edit: boolean
        message_delete: boolean
        role_changes: boolean
      }
      channel: {
        create: boolean
        edit: boolean
        delete: boolean
      }
      role: {
        create: boolean
        edit: boolean
        delete: boolean
      }
    }
    max_warn: {
      action: 'TIMEOUT' | 'KICK' | 'BAN'
      limit: number
    }
    counters: Array<{
      counter_type: string
      name: string
      channel_id: string
    }>
    greeting: {
      enabled: boolean
      channel?: string
      content?: string
      embed?: any
    }
    farewell: {
      enabled: boolean
      channel?: string
      content?: string
      embed?: any
    }
    autorole?: string
    reaction_roles: Array<{
      channel_id: string
      message_id: string
      roles: Array<{
        emote: string
        role_id: string
      }>
    }>
    suggestions: {
      channel_id?: string
      staff_roles: string[]
      enabled: boolean
      approved_channel?: string
      rejected_channel?: string
    }
    aiResponder?: {
      enabled: boolean
      freeWillChannels?: string[]
      mentionOnly: boolean
      allowDMs: boolean
      updatedAt?: Date
      updatedBy?: string
      stats?: {
        totalMessages: number
        tokensUsed: number
        toolCalls: number
        activeUsers: number
      }
    }
    colors: Array<{
      name: string
      hex: string
      roleId: string
    }>
  }

  interface IUser extends Document {
    _id: string
    username: string
    discriminator: string
    coins: number
    bank: number
    minaAi: {
      ignoreMe: boolean
      allowDMs: boolean
      combineDmWithServer: boolean
      globalServerMemories: boolean
      stats: {
        messages: number
        tokensUsed: number
        toolCalls: number
        memoriesCreated: number
        lastInteraction: Date | null
      }
    }
    reputation: {
      received: number
      given: number
      timestamp?: Date
    }
    daily: {
      streak: number
      timestamp?: Date
    }
    redflags: Array<{
      _id: string
      reason: string
      giver_id: string
      timestamp: Date
    }>
    flags: Array<{
      _id: string
      reason: string
      flaggedBy: string
      flaggedAt: Date
      serverId: string
      serverName: string
      actionType: string | null
    }>
    afk: {
      enabled: boolean
      reason: string | null
      since: Date | null
      endTime: Date | null
    }
    profile: {
      pronouns: string | null
      birthdate: Date | null
      age: number | null
      region: string | null
      languages: string[]
      timezone: string | null
      bio: string | null
      interests: string[]
      socials: Map<string, string>
      favorites: Map<string, string>
      goals: string[]
      privacy: {
        showAge: boolean
        showRegion: boolean
        showBirthdate: boolean
        showPronouns: boolean
        showAiStats: boolean
      }
      lastUpdated: Date
      createdAt: Date
    }
  }

  interface IMember extends Document {
    _id: string
    guild_id: string
    member_id: string
    strikes: number
    warnings: number
    invite_data?: {
      inviter?: string
      code?: string
      tracked: number
      fake: number
      left: number
      added: number
    }
    created_at?: Date
    updated_at?: Date
  }
}

export { }

