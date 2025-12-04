import { ChatInputCommandInteraction } from 'discord.js'
import { showReminderHub } from '@handlers/reminder'

const command: CommandData = {
  name: 'reminder',
  description: 'open the reminder management hub',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],
  dmCommand: true,

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    await showReminderHub(interaction)
  },
}

export default command
