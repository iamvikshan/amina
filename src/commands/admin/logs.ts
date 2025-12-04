import { ChatInputCommandInteraction } from 'discord.js'
import { showLoggingMenuDirect } from '@handlers/admin/logging'
import { Logger } from '@helpers/Logger'

const command: CommandData = {
  name: 'logs',
  description: 'configure audit logging for messages, roles, and channels',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, _data: any) {
    // Directly show the logging configuration from admin hub
    try {
      await interaction.deferReply({ ephemeral: true })
      await showLoggingMenuDirect(interaction)
    } catch (error) {
      Logger.error('Error showing logging menu', error)
      const errorMessage =
        'Failed to load the logging configuration menu. Please try again later.'

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        })
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        })
      }
    }
  },
}

export default command
