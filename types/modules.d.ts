 
// Module augmentation type definitions

import type { Client, Collection } from 'discord.js'
import type { Model } from 'mongoose'

// BotClient module augmentation
declare module '@structures/BotClient' {
  export class BotClient extends Client {
    config: any
    logger: any
    wait: (ms: number) => Promise<void>
    slashCommands: Collection<string, any>
    contextMenus: Collection<string, any>
    schemas: any
    musicManager: any
    giveawaysManager: any
    discordTogether: any

    loadEvents(directory: string): void
    loadCommand(cmd: any): void
    loadCommands(directory: string): Promise<void>
    loadContexts(directory: string): void
    registerInteractions(guildId?: string): Promise<void>
    resolveUsers(search: string, exact?: boolean): Promise<any[]>
    getInvite(): string
  }
}

// Config module augmentation
declare module '@src/config' {
  interface Config {
    BOT: {
      DEV_IDS: string[]
      TEST_GUILD_ID?: string
      SUPPORT_SERVER?: string
      DASHBOARD_URL?: string
      DONATE_URL?: string
    }
    AI: {
      MODEL: string
      EMBEDDING_MODEL: string
      EXTRACTION_MODEL: string
      MAX_TOKENS: number
      TIMEOUT_MS: number
      TEMPERATURE: number
      DM_ENABLED_GLOBALLY: boolean
      DEDUP_THRESHOLD: number
    }
    SERVER: {
      HEALTH_PORT: number
    }
    MONITORING: {
      ENVIRONMENT: string
      REVISION: string
    }
    INTERACTIONS: {
      SLASH: string
      CONTEXT: string
      GLOBAL: boolean
    }
    CACHE_SIZE: {
      GUILDS: number
      USERS: number
      MEMBERS: number
      REMINDERS: number
    }
    MESSAGES: {
      API_ERROR: string
    }
    FEEDBACK: {
      ENABLED: boolean
      URL?: string
    }
    AUTOMOD: {
      ENABLED: boolean
      // Colors moved to src/data/colors.json
    }
    ECONOMY: {
      ENABLED: boolean
      CURRENCY: string
      DAILY_COINS: number
      MIN_BEG_AMOUNT: number
      MAX_BEG_AMOUNT: number
    }
    MUSIC: {
      ENABLED: boolean
      IDLE_TIME: number
      DEFAULT_VOLUME: number
      MAX_SEARCH_RESULTS: number
      DEFAULT_SOURCE: string
      LAVALINK_NODES: any[]
      LAVALINK_RETRY_AMOUNT: number
      LAVALINK_RETRY_DELAY: number
    }
    STATS: {
      ENABLED: boolean
      XP_COOLDOWN: number
      DEFAULT_LVL_UP_MSG: string
    }
    GIVEAWAYS: {
      ENABLED: boolean
      REACTION: string
      // Colors moved to src/data/colors.json
    }
    IMAGE: {
      ENABLED: boolean
      BASE_API: string
    }
    INVITE: {
      ENABLED: boolean
    }
    SUGGESTIONS: {
      ENABLED: boolean
      EMOJI: {
        UP_VOTE: string
        DOWN_VOTE: string
      }
      // Colors moved to src/data/colors.json
    }
    TICKET: {
      ENABLED: boolean
      // Colors moved to src/data/colors.json
    }
    // EMBED_COLORS removed - use mina.color.* from src/data/colors.json
    MODERATION: {
      ENABLED: boolean
      // Colors moved to src/data/colors.json (moderation.*)
    }
  }

  interface Secrets {
    // Bot & Database
    readonly BOT_TOKEN: string
    readonly MONGO_CONNECTION: string
    readonly LOGS_WEBHOOK?: string

    // API Keys & Tokens
    readonly GEMINI_KEY?: string
    readonly GOOGLE_SERVICE_ACCOUNT_JSON?: string
    readonly VERTEX_PROJECT_ID?: string
    readonly VERTEX_REGION?: string
    readonly WEATHERSTACK_KEY?: string
    readonly STRANGE_API_KEY?: string
    readonly GH_TOKEN?: string
    readonly SPOTIFY_CLIENT_ID?: string
    readonly SPOTIFY_CLIENT_SECRET?: string
    readonly HONEYBADGER_API_KEY?: string
    readonly WEBHOOK_SECRET?: string

    // Lavalink Nodes
    readonly LAVALINK_NODES: Array<{
      id?: string
      host?: string
      port?: number
      authorization?: string
      secure?: boolean
    }>
  }

  // Type declarations for module exports - types are inferred from actual exports
  // The actual values are exported from the module files
}

// Logger module augmentation
declare module '@helpers/Logger' {
  interface Logger {
    log(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    debug(message: string, ...args: any[]): void
    success(message: string, ...args: any[]): void
  }
  const logger: Logger
  export = logger
}

// Schema module augmentations
declare module '@schemas/Guild' {
  // IGuildSettings is globally available, just reference it here
  export function getSettings(guild: any): Promise<IGuildSettings>
  export const Guild: Model<IGuildSettings>
}

declare module '@schemas/User' {
  // IUser is globally available, just reference it here
  export function getUser(user: any): Promise<IUser>
  export const User: Model<IUser>
}

declare module '@schemas/Member' {
  // IMember is globally available, just reference it here
  // Functions and Model are exported from the actual module file
}

declare module 'sourcebin_js';

export {}

