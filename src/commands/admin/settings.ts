import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
  Role,
} from 'discord.js'
import type { CommandData } from '@src/structures/Command'
import updateChannel from './settings/updateChannel'
import { addStaffRole, removeStaffRole } from './settings/staffRole'
import statusSettings from './settings/status'

const command: CommandData = {
  name: 'settings',
  description: "Manage Mina's settings for this server",
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    ephemeral: true,
    enabled: true,
    options: [
      {
        name: 'updateschannel',
        description: 'Set the updates channel for Mina',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'Select a channel for updates',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ],
            required: true,
          },
        ],
      },
      {
        name: 'staffadd',
        description: 'Add a staff role for Mina',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: 'Select a role to add as staff',
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: 'staffremove',
        description: 'Remove a staff role from Mina',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: 'Select a role to remove from staff',
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: 'status',
        description: 'List all current settings and their values',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: any
  ): Promise<void> {
    const sub = interaction.options.getSubcommand()

    if (sub === 'updateschannel') {
      const channel = interaction.options.getChannel('channel') as TextChannel
      return await updateChannel(interaction, channel, data.settings)
    }

    if (sub === 'staffadd') {
      const role = interaction.options.getRole('role') as Role
      return await addStaffRole(interaction, role, data.settings)
    }

    if (sub === 'staffremove') {
      const role = interaction.options.getRole('role') as Role
      return await removeStaffRole(interaction, role, data.settings)
    }

    if (sub === 'status') {
      return await statusSettings(interaction)
    }
  },
}

export default command
