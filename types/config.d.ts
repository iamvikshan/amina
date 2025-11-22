/* eslint-disable @typescript-eslint/no-unused-vars */
// Configuration type definitions

import type { ColorResolvable } from 'discord.js'

declare global {
  interface LavalinkNode {
    id?: string
    host?: string
    port: number
    authorization?: string
    secure: boolean
    retryAmount: number
    retryDelay: number
  }

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
      VISION_MODEL: string
      MAX_TOKENS: number
      TIMEOUT_MS: number
      TEMPERATURE: number
      DM_ENABLED_GLOBALLY: boolean
      UPSTASH_URL: string
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
      LOG_EMBED: ColorResolvable
      DM_EMBED: ColorResolvable
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
      LAVALINK_NODES: LavalinkNode[]
      LAVALINK_RETRY_AMOUNT: number
      LAVALINK_RETRY_DELAY: number
    }
    GIVEAWAYS: {
      ENABLED: boolean
      REACTION: string
      START_EMBED: ColorResolvable
      END_EMBED: ColorResolvable
    }
    IMAGE: {
      ENABLED: boolean
      BASE_API: string
    }
    INVITE: {
      ENABLED: boolean
    }
    EMBED_COLORS: {
      BOT_EMBED: ColorResolvable
      SUCCESS: ColorResolvable
      ERROR: ColorResolvable
      WARNING: ColorResolvable
    }
    MODERATION: {
      ENABLED: boolean
      EMBED_COLORS: {
        TIMEOUT: ColorResolvable
        UNTIMEOUT: ColorResolvable
        KICK: ColorResolvable
        SOFTBAN: ColorResolvable
        BAN: ColorResolvable
        UNBAN: ColorResolvable
        VMUTE: ColorResolvable
        VUNMUTE: ColorResolvable
        DEAFEN: ColorResolvable
        UNDEAFEN: ColorResolvable
        DISCONNECT: ColorResolvable
        MOVE: ColorResolvable
      }
    }
    STATS: {
      ENABLED: boolean
      XP_COOLDOWN: number
      DEFAULT_LVL_UP_MSG: string
    }
    SUGGESTIONS: {
      ENABLED: boolean
      EMOJI: {
        UP_VOTE: string
        DOWN_VOTE: string
      }
      DEFAULT_EMBED: ColorResolvable
      APPROVED_EMBED: ColorResolvable
      DENIED_EMBED: ColorResolvable
    }
    TICKET: {
      ENABLED: boolean
      CREATE_EMBED: ColorResolvable
      CLOSE_EMBED: ColorResolvable
    }
  }

  interface Secrets {
    // Bot & Database
    readonly BOT_TOKEN: string
    readonly MONGO_CONNECTION: string
    readonly LOGS_WEBHOOK?: string

    // API Keys & Tokens
    readonly GEMINI_KEY?: string
    readonly UPSTASH_VECTOR?: string
    readonly WEATHERSTACK_KEY?: string
    readonly STRANGE_API_KEY?: string
    readonly GH_TOKEN?: string
    readonly SPOTIFY_CLIENT_ID?: string
    readonly SPOTIFY_CLIENT_SECRET?: string
    readonly OPENAI?: string
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

  interface AiConfig {
    globallyEnabled: boolean
    model: string
    maxTokens: number
    timeoutMs: number
    systemPrompt: string
    temperature: number
    dmEnabledGlobally: boolean
    geminiKey: string
    upstashUrl: string
    upstashToken: string
  }
}

export {}

