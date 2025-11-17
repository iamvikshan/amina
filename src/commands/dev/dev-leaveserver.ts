import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import leaveserver from './sub/leaveServer'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'dev-leaveserver',
  description: 'Leave a server',
  category: 'DEV',
  botPermissions: ['EmbedLinks'],
  devOnly: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'serverid',
        description: 'ID of the server to leave',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('serverid', true)
    const guild = interaction.client.guilds.cache.get(serverId)

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
  },
}

export default command
