import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
} from 'discord.js'
import type { CommandData } from '@src/structures/Command'
import statusHandler from './mina-ai/status'
import configureHandler from './mina-ai/configure'
import freewillHandler from './mina-ai/freewill'
import mentionOnlyHandler from './mina-ai/mentiononly'
import dmsHandler from './mina-ai/dms'

const command: CommandData = {
  name: 'admin',
  description: 'Admin commands for Amina',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'mina-ai',
        description: 'Configure Amina AI for your server',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'status',
            description: 'View AI configuration for this server',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'configure',
            description: 'Enable or disable AI responses in this server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'enabled',
                description: 'Enable or disable AI',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'freewill',
            description: 'Set a channel where I respond to all messages',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel for free-will mode',
                type: ApplicationCommandOptionType.Channel,
                channelTypes: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: 'mention-only',
            description: 'Toggle mention-only mode (requires @mention to respond)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'enabled',
                description: 'Enable or disable mention-only mode',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'dms',
            description: 'Enable or disable DM support for your server members',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'enabled',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const group = interaction.options.getSubcommandGroup()
    const sub = interaction.options.getSubcommand()

    if (group === 'mina-ai') {
      switch (sub) {
        case 'status':
          await statusHandler(interaction, data.settings)
          break
        case 'configure':
          await configureHandler(interaction, data.settings)
          break
        case 'freewill':
          await freewillHandler(interaction, data.settings)
          break
        case 'mention-only':
          await mentionOnlyHandler(interaction, data.settings)
          break
        case 'dms':
          await dmsHandler(interaction, data.settings)
          break
        default:
          await interaction.followUp('Invalid subcommand!')
      }
    }
  },
}

export default command
