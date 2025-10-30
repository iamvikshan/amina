// Type definitions for Mongoose schemas used in the application

import type { Document, Model } from 'mongoose'

declare module '@schemas/Guild' {
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
  }

  export function getSettings(guild: any): Promise<IGuildSettings>
  export const Guild: Model<IGuildSettings>
}

declare module '@schemas/User' {
  interface IUser extends Document {
    _id: string
    username: string
    discriminator: string
    coins: number
    bank: number
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
  }

  export function getUser(user: any): Promise<IUser>
  export const User: Model<IUser>
}

export {}

