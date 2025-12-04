import { ChatInputCommandInteraction } from 'discord.js'
import { showLoggingMenuDirect } from '@handlers/admin/logging'

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
    await showLoggingMenuDirect(interaction)
  },
}

export default command
