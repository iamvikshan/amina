import { ChatInputCommandInteraction } from 'discord.js'
import { showDevHub } from '@handlers/dev'

const command: CommandData = {
  name: 'dev',
  description: 'Developer-only commands',
  category: 'DEV',
  botPermissions: ['EmbedLinks'],
  devOnly: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    // Show dev hub
    await showDevHub(interaction)
  },
}

export default command
