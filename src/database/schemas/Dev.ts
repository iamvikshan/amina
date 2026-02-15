import mongoose from 'mongoose'
import { loadDefaultPrompt } from '../../helpers/promptLoader'
import config from '../../config/config'

// Load default system prompt from prompt.md (used as seed value)
const defaultSystemPrompt = loadDefaultPrompt()

// Schema uses config.ts values as defaults - these seed the DB on first run
// After initialization, all changes must be made via dev commands or MongoDB
const Schema = new mongoose.Schema(
  {
    PRESENCE: {
      ENABLED: {
        type: Boolean,
        default: true,
      },
      STATUS: {
        type: String,
        enum: ['online', 'idle', 'dnd', 'invisible'],
        default: 'idle',
      },
      TYPE: {
        type: String,
        enum: [
          'COMPETING',
          'LISTENING',
          'PLAYING',
          'WATCHING',
          'STREAMING',
          'CUSTOM',
        ],
        default: 'CUSTOM',
      },
      MESSAGE: {
        type: String,
        default: "We'll show them. We'll show them all...",
      },
      URL: {
        type: String,
        default: 'https://twitch.tv/iamvikshan',
      },
    },
    DEV_COMMANDS: {
      ENABLED: {
        type: Boolean,
        default: false,
      },
    },
    AI_CONFIG: {
      globallyEnabled: {
        type: Boolean,
        default: false,
      },
      model: {
        type: String,
        default: config.AI.MODEL,
      },
      // visionModel: {
      //   type: String,
      //   default: config.AI.VISION_MODEL,
      // },
      maxTokens: {
        type: Number,
        default: config.AI.MAX_TOKENS,
      },
      timeoutMs: {
        type: Number,
        default: config.AI.TIMEOUT_MS,
      },
      systemPrompt: {
        type: String,
        default: defaultSystemPrompt,
      },
      temperature: {
        type: Number,
        default: config.AI.TEMPERATURE,
      },
      dmEnabledGlobally: {
        type: Boolean,
        default: config.AI.DM_ENABLED_GLOBALLY,
      },
      embeddingModel: {
        type: String,
        default: config.AI.EMBEDDING_MODEL,
      },
      extractionModel: {
        type: String,
        default: config.AI.EXTRACTION_MODEL,
      },
      dedupThreshold: {
        type: Number,
        default: config.AI.DEDUP_THRESHOLD,
        min: 0,
        max: 1,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: String,
        default: null,
      },
    },

    BOT_STATS: {
      guilds: {
        type: Number,
        default: 0,
      },
      users: {
        type: Number,
        default: 0,
      },
      channels: {
        type: Number,
        default: 0,
      },
      ping: {
        type: Number,
        default: 0,
      },
      uptime: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
)

export const Model = mongoose.model('dev-config', Schema)

export async function getPresenceConfig(): Promise<any> {
  const document = await Model.findOne()
  if (!document) return await Model.create({})
  return document
}

export async function updatePresenceConfig(update: any): Promise<any> {
  const document = await Model.findOne()
  if (!document) return await Model.create(update)

  for (const [key, value] of Object.entries(update.PRESENCE)) {
    if (document.PRESENCE) {
      ;(document.PRESENCE as any)[key] = value
    }
  }

  return await document.save()
}

export async function getDevCommandsConfig(): Promise<any> {
  const document = await Model.findOne()
  if (!document) return (await Model.create({})).DEV_COMMANDS
  return document.DEV_COMMANDS
}

export async function setDevCommands(enabled: boolean): Promise<any> {
  const document = await Model.findOne()
  if (!document)
    return (await Model.create({ DEV_COMMANDS: { ENABLED: enabled } }))
      .DEV_COMMANDS

  if (document.DEV_COMMANDS) {
    document.DEV_COMMANDS.ENABLED = enabled
  }
  await document.save()
  return document.DEV_COMMANDS
}

// NEW: Update bot statistics
export async function updateBotStats(stats: {
  guilds: number
  users: number
  channels: number
  ping: number
  uptime: number
}): Promise<any> {
  const document = await Model.findOne()
  if (!document) {
    return await Model.create({
      BOT_STATS: { ...stats, lastUpdated: new Date() },
    })
  }

  document.BOT_STATS = {
    ...stats,
    lastUpdated: new Date(),
  }

  await document.save()
  return document.BOT_STATS
}

// NEW: Get bot statistics
export async function getBotStats(): Promise<any> {
  const document = await Model.findOne()
  if (!document) return (await Model.create({})).BOT_STATS
  return document.BOT_STATS
}

// NEW: Get AI config
export async function getAiConfig(): Promise<any> {
  const document = await Model.findOne()
  if (!document) return (await Model.create({})).AI_CONFIG
  return document.AI_CONFIG
}

// NEW: Update AI config
export async function updateAiConfig(update: any): Promise<any> {
  const document = await Model.findOne()
  if (!document) return await Model.create({ AI_CONFIG: update })

  // Merge update into AI_CONFIG
  for (const [key, value] of Object.entries(update)) {
    if (document.AI_CONFIG) {
      ;(document.AI_CONFIG as any)[key] = value
    }
  }

  if (document.AI_CONFIG) {
    document.AI_CONFIG.updatedAt = new Date()
  }
  await document.save()
  return document.AI_CONFIG
}
