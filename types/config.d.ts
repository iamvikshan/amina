 
// Configuration type definitions

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
      // These values seed the database on first run
      // After initialization, all changes must be made via dev commands or MongoDB
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
      URL?: string | undefined
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
      LAVALINK_NODES: LavalinkNode[]
      LAVALINK_RETRY_AMOUNT: number
      LAVALINK_RETRY_DELAY: number
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
    // EMBED_COLORS removed - use mina.color.* from src/data/colors.json
    MODERATION: {
      ENABLED: boolean
      // Colors moved to src/data/colors.json (moderation.*)
    }
    STATS: {
      ENABLED: boolean
      XP_COOLDOWN: number
      DEFAULT_LVL_UP_MSG: string
    }
    TICKET: {
      ENABLED: boolean
      // Colors moved to src/data/colors.json
    }
  }

  interface Secrets {
    // Bot & Database
    readonly BOT_TOKEN: string
    readonly MONGO_CONNECTION: string
    readonly LOGS_WEBHOOK?: string | undefined

    // API Keys & Tokens
    readonly MISTRAL?: string | undefined
    readonly GEMINI?: string | undefined
    readonly VOYAGE?: string | undefined
    readonly VOYAGE_MONGO?: string | undefined
    readonly WEATHERSTACK_KEY?: string | undefined
    readonly STRANGE_API_KEY?: string | undefined
    readonly SPOTIFY_CLIENT_ID?: string | undefined
    readonly SPOTIFY_CLIENT_SECRET?: string | undefined
    readonly HONEYBADGER_API_KEY?: string | undefined
    readonly WEBHOOK_SECRET?: string | undefined

    // Lavalink Nodes
    readonly LAVALINK_NODES: Array<{
      id?: string | undefined
      host?: string | undefined
      port?: number | undefined
      authorization?: string | undefined
      secure?: boolean | undefined
    }>
  }

  interface AiConfig {
    globallyEnabled: boolean
    model: string
    embeddingModel: string
    extractionModel: string
    maxTokens: number
    timeoutMs: number
    systemPrompt: string
    temperature: number
    dmEnabledGlobally: boolean
    dedupThreshold: number
    geminiApiKey: string
    mistralApiKey?: string | undefined
    voyageApiKey?: string | undefined
    voyageMongoApiKey?: string | undefined
  }

  interface AiAuthConfig {
    geminiApiKey: string
    mistralApiKey?: string | undefined
    voyageApiKey?: string | undefined
    voyageMongoApiKey?: string | undefined
  }
}

export {}

