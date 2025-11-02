import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import type { Guild } from 'discord.js'

/**
 * Updates the counter channel for all the guildId's present in the update queue
 * @param client - The bot client instance
 */
export async function updateCounterChannels(client: BotClient): Promise<void> {
  client.counterUpdateQueue.forEach(async guildId => {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return

    try {
      const settings = await getSettings(guild)

      const all = guild.memberCount
      const bots = settings.server.bots
      const members = all - bots

      for (const config of settings.counters) {
        const chId = config.channel_id
        const vc = guild.channels.cache.get(chId)
        if (!vc) continue

        let channelName
        if (config.counter_type.toUpperCase() === 'USERS')
          channelName = `${config.name} : ${all}`
        if (config.counter_type.toUpperCase() === 'MEMBERS')
          channelName = `${config.name} : ${members}`
        if (config.counter_type.toUpperCase() === 'BOTS')
          channelName = `${config.name} : ${bots}`

        if (vc.manageable)
          vc.setName(channelName).catch(err =>
            (vc.client as BotClient).logger.log('Set Name error: ', err)
          )
      }
    } catch (ex) {
      client.logger.error(
        `Error updating counter channels for guildId: ${guildId}`,
        ex
      )
    } finally {
      // remove guildId from cache
      const i = client.counterUpdateQueue.indexOf(guild.id)
      if (i > -1) client.counterUpdateQueue.splice(i, 1)
    }
  })
}

/**
 * Initialize guild counters at startup
 * @param guild - The guild to initialize counters for
 * @param settings - The guild settings
 */
export async function init(guild: Guild, settings: any): Promise<boolean> {
  if (
    settings.counters.find((doc: any) =>
      ['MEMBERS', 'BOTS'].includes(doc.counter_type.toUpperCase())
    )
  ) {
    const stats = await (guild as any).fetchMemberStats()
    settings.server.bots = stats[1] // update bot count in database
    await settings.save()
  }

  // schedule for update
  const client = guild.client as BotClient
  if (!client.counterUpdateQueue.includes(guild.id))
    client.counterUpdateQueue.push(guild.id)
  return true
}
