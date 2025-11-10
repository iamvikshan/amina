import mongoose from 'mongoose'

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
    // NEW: Bot statistics updated every 10 minutes by presence handler
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
    document.PRESENCE[key] = value
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

  document.DEV_COMMANDS.ENABLED = enabled
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
