import { ChatInputCommandInteraction } from 'discord.js'
import { MODERATION } from '@src/config'

import { showPurgeHub } from '@handlers/purge'

const command: CommandData = {
  name: 'purge',
  description:
    'bulk delete messages with filters for user, bots, or content type',
  category: 'MODERATION',
  userPermissions: ['ManageMessages'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    ephemeral: false, // Non-ephemeral for audit trail
    options: [], // No subcommands - all handled via components
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    await showPurgeHub(interaction)
    return
  },
}

export default command
