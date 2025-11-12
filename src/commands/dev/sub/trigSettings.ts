import { getSettings } from '@schemas/Guild'
import type { ChatInputCommandInteraction, Client, Guild } from 'discord.js'

export default async function trigSettings(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const serverId = interaction.options.getString('serverid')
  const response = await triggerOnboarding(interaction.client, serverId)
  await interaction.followUp(response)
}

async function triggerOnboarding(
  client: Client,
  serverId: string | null = null
): Promise<string> {
  const guildCreateEvent = client.emit.bind(client, 'guildCreate')

  if (serverId) {
    const guild = client.guilds.cache.get(serverId)
    if (!guild) return '❌ Guild not found'
    const settings = await getSettings(guild)
    if (settings.server.setup_completed) return '❌ Guild already set up'
    guildCreateEvent(guild)
    return `✅ Triggered settings for ${guild.name}`
  }

  let count = 0
  for (const [, guild] of client.guilds.cache) {
    const settings = await getSettings(guild as Guild)
    if (!settings.server.setup_completed) {
      guildCreateEvent(guild)
      count++
    }
  }

  return `✅ Triggered settings for ${count} guilds`
}
