import { ActivityType } from 'discord.js'
import { getPresenceConfig } from '@schemas/Dev'
import type { BotClient } from '@src/structures'

/**
 * Updates the bot's presence/status
 * @param client - The bot client instance
 */
async function updatePresence(client: BotClient): Promise<void> {
  const config = await getPresenceConfig()

  if (!config.PRESENCE.ENABLED) {
    client.user.setPresence({
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

  await client.user.setPresence({
    status: config.PRESENCE.STATUS as any,
    activities: [activity],
  })

  // Log the presence update
  client.logger.log(
    `Presence Updated: STATUS:${config.PRESENCE.STATUS}, TYPE:${config.PRESENCE.TYPE}`
  )
}

/**
 * Initialize and handle bot presence updates
 * @param client - The bot client instance
 */
export default async function handlePresence(client: BotClient): Promise<void> {
  await updatePresence(client)
  setInterval(() => updatePresence(client), 10 * 60 * 1000)
}
