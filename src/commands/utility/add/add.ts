import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { handleAddReminder } from '@handlers/reminder'
import { handleAddColor } from './sub/color'
import { handleAddInvites } from './sub/invites'

const command: CommandData = {
  name: 'add',
  description: 'quick add for reminders, colors, invites, and more',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'reminder',
        description: 'set a reminder for later',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message',
            description: 'what should i remind you about?',
            type: ApplicationCommandOptionType.String,
            required: true,
            max_length: 500,
          },
          {
            name: 'in',
            description: 'when to remind (e.g., 1h, 2d, 6h). defaults to 6h',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: 'color',
        description: 'create a new color option (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'display name for the color',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'hex',
            description: 'hex code like #FF0000',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'invites',
        description: 'manually add invites to a user (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to add invites to',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'invites',
            description: 'number of invites to add',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()

    switch (subcommand) {
      case 'reminder':
        await handleAddReminder(interaction)
        break
      case 'color':
        await handleAddColor(interaction)
        break
      case 'invites':
        await handleAddInvites(interaction)
        break
    }
  },
}

export default command
