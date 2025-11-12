import type { ChatInputCommandInteraction } from 'discord.js'

export default async function leaveserver(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const input = interaction.options.getString('serverid', true)
  const guild = interaction.client.guilds.cache.get(input)

  if (!guild) {
    await interaction.followUp(
      `No server found. Please provide a valid server ID.`
    )
    return
  }

  const name = guild.name
  try {
    await guild.leave()
    await interaction.followUp(`Successfully left \`${name}\``)
  } catch (err) {
    ;(interaction.client as any).logger.error('GuildLeave', err)
    await interaction.followUp(`Failed to leave \`${name}\``)
  }
}
