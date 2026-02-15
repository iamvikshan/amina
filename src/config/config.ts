import { secret } from './secrets'

const config: Config = {
  BOT: {
    DEV_IDS: ['929835843479302204'],
    TEST_GUILD_ID: '1072214895598248030',
    SUPPORT_SERVER: 'https://discord.gg/uMgS9evnmv',
    DASHBOARD_URL: 'https://4mina.app',
    DONATE_URL: 'https://ko-fi.com/vikshan',
  },
  AI: {
    // These values seed the database on first run
    // After initialization, all changes must be made via dev commands or directly in MongoDB
    MODEL: 'gemini-3-flash-preview',
    EMBEDDING_MODEL: 'text-embedding-005', // Upgrade to gemini-embedding-001 (3072-dim SOTA) in Phase 2 with @google/genai SDK
    EXTRACTION_MODEL: 'gemini-2.5-flash-lite',
    // VISION_MODEL: 'gemini-3-pro-preview', // Used for images/videos/gifs
    MAX_TOKENS: 1024,
    TIMEOUT_MS: 20000,
    TEMPERATURE: 0.7,
    DM_ENABLED_GLOBALLY: true,
    UPSTASH_URL: 'https://up-wolf-22896-us1-vector.upstash.io',
  },
  SERVER: {
    HEALTH_PORT: 3000,
  },
  MONITORING: {
    ENVIRONMENT:
      process.env.NODE_ENV || process.env.DOPPLER_ENVIRONMENT || 'development',
    REVISION: process.env.HONEYBADGER_REVISION || 'unknown',
  },
  INTERACTIONS: {
    SLASH: 'true', // Should the interactions be enabled
    CONTEXT: 'true', // Should contexts be enabled
    GLOBAL:
      process.env.GLOBAL !== undefined ? process.env.GLOBAL === 'true' : true, // Should the interactions be registered globally
  },

  CACHE_SIZE: {
    GUILDS: 100,
    USERS: 10000,
    MEMBERS: 10000,
    REMINDERS: 10000,
  },
  MESSAGES: {
    API_ERROR: 'something broke on my end. `/report` if it keeps happening.',
  },

  // whether or not to enable feedback/report system
  FEEDBACK: {
    ENABLED: true,
    URL: secret.LOGS_WEBHOOK,
  },

  AUTOMOD: {
    ENABLED: true,
    // Colors are defined in src/data/colors.json (features.automodLog, features.automodDm)
  },

  ECONOMY: {
    ENABLED: true,
    CURRENCY: '₪',
    DAILY_COINS: 100, // coins to be received by daily command
    MIN_BEG_AMOUNT: 100, // minimum coins to be received when beg command is used
    MAX_BEG_AMOUNT: 2500, // maximum coins to be received when beg command is used
  },

  MUSIC: {
    ENABLED: true,
    IDLE_TIME: 60, // Time in seconds before the bot disconnects from an idle voice channel
    DEFAULT_VOLUME: 60, // Default player volume 1-100
    MAX_SEARCH_RESULTS: 5,
    DEFAULT_SOURCE: 'scsearch', // ytsearch = Youtube, ytmsearch = Youtube Music, scsearch = SoundCloud, spsearch = Spotify
    LAVALINK_RETRY_AMOUNT: 20,
    LAVALINK_RETRY_DELAY: 30000,
    LAVALINK_NODES: secret.LAVALINK_NODES.map(node => ({
      id: node.id,
      host: node.host,
      port: node.port || 2333,
      authorization: node.authorization,
      secure: node.secure || false,
      retryAmount: 20,
      retryDelay: 30000,
    })).filter(node => node.id && node.host), // Only include nodes that are defined
  },

  GIVEAWAYS: {
    ENABLED: true,
    REACTION: '🎁',
    // Colors are defined in src/data/colors.json (features.giveaway, features.giveawayEnd)
  },

  IMAGE: {
    ENABLED: true,
    BASE_API: 'https://imageapi.strangebot.fun/api',
  },

  INVITE: {
    ENABLED: true,
  },
  MODERATION: {
    ENABLED: true,
    // Colors are defined in src/data/colors.json (moderation.*)
  },

  STATS: {
    ENABLED: true,
    XP_COOLDOWN: 5,
    DEFAULT_LVL_UP_MSG: '{member:tag}, you hit **level {level}**. nice.',
  },

  TICKET: {
    ENABLED: true,
    // Colors are defined in src/data/colors.json (features.ticket, features.ticketClose)
  },
}

// Export as default
export default config

// Export as named export for convenience
export { config }

// Named exports for destructured requires
export const {
  BOT,
  AI,
  SERVER,
  MONITORING,
  INTERACTIONS,
  CACHE_SIZE,
  MESSAGES,
  FEEDBACK,
  AUTOMOD,
  ECONOMY,
  MUSIC,
  GIVEAWAYS,
  IMAGE,
  INVITE,
  MODERATION,
  STATS,
  TICKET,
} = config
