 
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
      // VISION_MODEL: string
      MAX_TOKENS: number
      TIMEOUT_MS: number
      TEMPERATURE: number
      DM_ENABLED_GLOBALLY: boolean
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

  interface AiConfigBase {
    globallyEnabled: boolean
    model: string
    embeddingModel: string
    extractionModel: string
    maxTokens: number
    timeoutMs: number
    systemPrompt: string
    temperature: number
    dmEnabledGlobally: boolean
  }

  interface ApiKeyAiConfig extends AiConfigBase {
    authMode: 'api-key'
    geminiKey?: string
    // Optional — may have vertex fields even in api-key mode (for display/future fallback)
    vertexProjectId?: string
    vertexRegion?: string
    googleServiceAccountJson?: string
  }

  /**
   * Parsed Google service account JSON credentials.
   * Index signature allows extra vendor-specific fields.
   */
  interface GoogleServiceAccountCredentials {
    project_id: string
    private_key: string
    client_email: string
    private_key_id?: string
    client_id?: string
    type?: string
    auth_uri?: string
    token_uri?: string
    [key: string]: unknown
  }

  interface VertexAiConfig extends AiConfigBase {
    authMode: 'vertex'
    vertexProjectId: string
    vertexRegion: string
    googleServiceAccountJson: string
    parsedCredentials: GoogleServiceAccountCredentials
    geminiKey?: string // optional fallback key
  }

  type AiConfig = ApiKeyAiConfig | VertexAiConfig
}

export {}

