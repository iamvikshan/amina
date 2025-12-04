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
  description: 'set up audit logging for messages, roles, and channels',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'channel',
        description: 'set the channel for mod logs',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'logs-channel',
            description: 'channel to send logs to',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'toggle',
        description: 'enable or disable specific log types',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'ghostping',
            description: 'log deleted messages that contained mentions',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'msg-edit',
            description: 'log when messages are edited',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'msg-del',
            description: 'log when messages are deleted',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'mbr-role',
            description: 'log when member roles change',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-create',
            description: 'log when channels are created',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-edit',
            description: 'log when channels are modified',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'chnl-del',
            description: 'log when channels are deleted',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-create',
            description: 'log when roles are created',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-edit',
            description: 'log when roles are modified',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: 'role-del',
            description: 'log when roles are deleted',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'status',
                description: 'on or off',
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'all',
        description: 'toggle all logging at once',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'on or off',
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
