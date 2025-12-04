import { ChatInputCommandInteraction } from 'discord.js'

import { showMinaAiHub } from '@handlers/minaai'

const command: CommandData = {
  name: 'mina-ai',
  description: 'manage your conversation history and memory settings with me',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],
  dmCommand: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    await showMinaAiHub(interaction)
  },
}

export default command
