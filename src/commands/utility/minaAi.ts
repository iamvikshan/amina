import { ChatInputCommandInteraction } from 'discord.js'
import type { Command } from '@structures/Command'
import { showMinaAiHub } from '@handlers/minaai'

const command: Command = {
  name: 'mina-ai',
  description: 'Manage your memories with Mina AI',
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
