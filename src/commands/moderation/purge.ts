import { ChatInputCommandInteraction } from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'
import { showPurgeHub } from '@handlers/purge'

const command: Command = {
  name: 'purge',
  description: 'Delete messages from a channel using guided flow',
  category: 'MODERATION',
  userPermissions: ['ManageMessages'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    ephemeral: false, // Non-ephemeral for audit trail
    options: [], // No subcommands - all handled via components
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    await showPurgeHub(interaction)
  },
}

export default command
