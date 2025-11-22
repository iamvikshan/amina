import type { ColorResolvable } from 'discord.js'
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
    MODEL: 'gemini-flash-latest',
    VISION_MODEL: 'gemini-3-pro-preview', // Used for images/videos/gifs
    MAX_TOKENS: 1024,
    TIMEOUT_MS: 20000,
    // System prompt is loaded from src/data/prompt.md via promptLoader helper
    // To modify the system prompt, edit src/data/prompt.md instead
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
  },
  MESSAGES: {
    API_ERROR:
      'Oopsie! 🌟 Something went wrong on our end. Please try again later. If this keeps happening, reach out to our support server or run `/report`! 💖',
  },

  // whether or not to enable feedback/report system
  FEEDBACK: {
    ENABLED: true,
    URL: secret.LOGS_WEBHOOK,
  },

  AUTOMOD: {
    ENABLED: true,
    LOG_EMBED: '#F1F1F1', // Light gray for a neutral tone
    DM_EMBED: '#FFB3D9', // Soft pastel pink for DM embeds
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
    START_EMBED: '#FFB3D9', // Soft pastel pink for giveaway embeds
    END_EMBED: '#FFB3D9',
  },

  IMAGE: {
    ENABLED: true,
    BASE_API: 'https://strangeapi.hostz.me/api',
  },

  INVITE: {
    ENABLED: true,
  },
  EMBED_COLORS: {
    BOT_EMBED: '#FF1493', // (Deep pink - represents her core energy and vibrant spirit)
    SUCCESS: '#00FFB3', // (Bright aqua - her creative, unique way of seeing success)
    ERROR: '#FF6978', // (Coral pink - softer than traditional red, showing her sensitivity even in errors)
    WARNING: '#FFD93D', // (Bright yellow - her playful way of warning others)
  },
  MODERATION: {
    ENABLED: true,
    EMBED_COLORS: {
      TIMEOUT: '#9B6DFF', // (Soft purple - gentle but firm)
      UNTIMEOUT: '#4DEEEA', // (Bright turquoise - freedom and relief)
      KICK: '#FF9A8C', // (Salmon pink - serious but not harsh)
      SOFTBAN: '#FF75C3', // (Medium pink - firm but temporary)
      BAN: '#FF3864', // (Strong pink-red - serious but still on-brand)
      UNBAN: '#00F5D4', // (Mint green - fresh starts)
      VMUTE: '#D4B3FF', // (Lavender - gentle silence)
      VUNMUTE: '#98FB98', // (Pale green - gentle freedom)
      DEAFEN: '#C8A2C8', // (Lilac - peaceful quiet)
      UNDEAFEN: '#7FFFD4', // (Aquamarine - return to sound)
      DISCONNECT: 'Random', // (Keeps her chaotic energy)
      MOVE: 'Random', // (Keeps her spontaneity)
    },
  },

  STATS: {
    ENABLED: true,
    XP_COOLDOWN: 5,
    DEFAULT_LVL_UP_MSG:
      '{member:tag}, Yay! 🎉 You just leveled up to **Level {level}**! 🌟',
  },

  SUGGESTIONS: {
    ENABLED: true,
    EMOJI: {
      UP_VOTE: '⬆️',
      DOWN_VOTE: '⬇️',
    },
    DEFAULT_EMBED: '#FFB8DE', // (Light pink - welcoming new ideas)
    APPROVED_EMBED: '#47E0A0', // (Seafoam green - creative acceptance)
    DENIED_EMBED: '#FF8BA7', // (Soft rose - gentle rejection)
  },

  TICKET: {
    ENABLED: true,
    CREATE_EMBED: '#E0AAFF' as ColorResolvable, // (Soft violet - welcoming support)
    CLOSE_EMBED: '#48D1CC' as ColorResolvable, // (Turquoise - positive closure)
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
  EMBED_COLORS,
  MODERATION,
  STATS,
  SUGGESTIONS,
  TICKET,
} = config
