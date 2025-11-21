import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'
import setChannel from './logs/setChannel'
import toggleSetting from './logs/toggleSetting'
import toggleAll from './logs/toggleAll'

const command: CommandData = {
  name: 'logs',
  description: 'Configure moderation logs',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'channel',
        description: 'Set the logs channel',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'logs-channel',
            description: 'Select the channel to send mod logs',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'toggle',
        description: 'Toggle specific logging options',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'ghostping',
            description: 'Toggle anti-ghostping logging',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'msg-edit',
            description: 'Toggle logging for message edits',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'msg-del',
            description: 'Toggle logging for message deletions',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'mbr-role',
            description: 'Toggle logging for member role changes',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-create',
            description: 'Toggle logging for channel creation',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-edit',
            description: 'Toggle logging for channel edits',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-del',
            description: 'Toggle logging for channel deletions',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-create',
            description: 'Toggle logging for role creation',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-edit',
            description: 'Toggle logging for role edits',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-del',
            description: 'Toggle logging for role deletions',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'Enable or disable',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'all',
        description: 'Enable or disable all logging',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'Enable or disable all logging',
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const subCommand = interaction.options.getSubcommand()
    const subCommandGroup = interaction.options.getSubcommandGroup()

    // Set channel subcommand
    if (subCommand === 'channel') {
      const targetChannel = interaction.options.getChannel(
        'logs-channel',
        true
      ) as TextChannel
      const response = await setChannel(targetChannel, data.settings)
      return interaction.followUp(response)
    }

    // Toggle subcommand group
    if (subCommandGroup === 'toggle') {
      const status = interaction.options.getBoolean('status', true)
      let response: string

      switch (subCommand) {
        case 'ghostping':
          response = await toggleSetting(
            data.settings,
            'automod.anti_ghostping',
            status
          )
          break
        case 'msg-edit':
          response = await toggleSetting(
            data.settings,
            'logs.member.message_edit',
            status
          )
          break
        case 'msg-del':
          response = await toggleSetting(
            data.settings,
            'logs.member.message_delete',
            status
          )
          break
        case 'mbr-role':
          response = await toggleSetting(
            data.settings,
            'logs.member.role_changes',
            status
          )
          break
        case 'chnl-create':
          response = await toggleSetting(
            data.settings,
            'logs.channel.create',
            status
          )
          break
        case 'chnl-edit':
          response = await toggleSetting(
            data.settings,
            'logs.channel.edit',
            status
          )
          break
        case 'chnl-del':
          response = await toggleSetting(
            data.settings,
            'logs.channel.delete',
            status
          )
          break
        case 'role-create':
          response = await toggleSetting(
            data.settings,
            'logs.role.create',
            status
          )
          break
        case 'role-edit':
          response = await toggleSetting(
            data.settings,
            'logs.role.edit',
            status
          )
          break
        case 'role-del':
          response = await toggleSetting(
            data.settings,
            'logs.role.delete',
            status
          )
          break
        default:
          response = 'Invalid toggle option!'
      }
      return interaction.followUp(response)
    }

    // Toggle all subcommand
    if (subCommand === 'all') {
      const status = interaction.options.getBoolean('status', true)
      const response = await toggleAll(status, data.settings)
      return interaction.followUp(response)
    }
    return
  },
}

export default command
