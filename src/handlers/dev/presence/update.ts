import { ActivityType } from 'discord.js'
import { getPresenceConfig, updateBotStats } from '@schemas/Dev'
import type { BotClient } from '@src/structures'

/**
 * Updates the bot's presence/status AND bot statistics
 * Migrated from handlers/presence.ts
 * @param client - The bot client instance
 */
export async function updatePresence(client: BotClient): Promise<void> {
  const config = await getPresenceConfig()

  // Update bot statistics in database (for dashboard)
  try {
    // Get WebSocket ping, default to 0 if not available yet
    const wsPing = client.ws.ping > 0 ? client.ws.ping : 0

    const stats = {
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0),
      channels: client.channels.cache.size,
      ping: wsPing,
      uptime: process.uptime(),
    }

    await updateBotStats(stats)
    // client.logger.log(
    //   `Bot stats updated: ${stats.guilds} guilds, ${stats.users} users, ${stats.channels} channels, ${wsPing}ms ping`
    // )
  } catch (error) {
    client.logger.error('Failed to update bot stats:', error)
  }

  // Update presence status
  if (!config.PRESENCE.ENABLED) {
    client.user?.setPresence({
      status: 'invisible',
      activities: [],
    })
    return
  }

  let message = config.PRESENCE.MESSAGE

  if (message.includes('{servers}')) {
    message = message.replaceAll('{servers}', String(client.guilds.cache.size))
  }

  if (message.includes('{members}')) {
    const members = client.guilds.cache
      .map(g => g.memberCount)
      .reduce((partial_sum, a) => partial_sum + a, 0)
    message = message.replaceAll('{members}', String(members))
  }

  const getType = (type: string): ActivityType => {
    switch (type) {
      case 'COMPETING':
        return ActivityType.Competing
      case 'LISTENING':
        return ActivityType.Listening
      case 'PLAYING':
        return ActivityType.Playing
      case 'WATCHING':
        return ActivityType.Watching
      case 'STREAMING':
        return ActivityType.Streaming
      case 'CUSTOM':
        return ActivityType.Custom
      default:
        return ActivityType.Playing
    }
  }

  const activity: any = {
    name: message,
    type: getType(config.PRESENCE.TYPE),
  }

  // Handle streaming activity type with URL support
  if (config.PRESENCE.TYPE === 'STREAMING') {
    activity.url = config.PRESENCE.URL
  }

  // Handle custom status with emoji and state
  if (config.PRESENCE.TYPE === 'CUSTOM') {
    activity.state = config.PRESENCE.MESSAGE
  }

  await client.user?.setPresence({
    status: config.PRESENCE.STATUS as any,
    activities: [activity],
  })
}
