import suggestionHandler from '@handlers/suggestion'
import { parsePermissions } from '@helpers/Utils'
import { SUGGESTIONS } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
  GuildMember,
} from 'discord.js'
import type { PermissionResolvable } from 'discord.js'

const { approveSuggestion, rejectSuggestion } = suggestionHandler

const CHANNEL_PERMS: PermissionResolvable[] = [
  'ViewChannel',
  'SendMessages',
  'EmbedLinks',
  'ManageMessages',
  'ReadMessageHistory',
]

const command: CommandData = {
  name: 'suggestion',
  description: 'configure suggestion system',
  category: 'SUGGESTION',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: SUGGESTIONS.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'status',
        description: 'enable or disable suggestion status',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'enabled or disabled',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: 'ON',
                value: 'ON',
              },
              {
                name: 'OFF',
                value: 'OFF',
              },
            ],
          },
        ],
      },
      {
        name: 'channel',
        description: 'configure suggestion channel or disable it',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel_name',
            description: 'the channel where suggestions will be sent',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: 'appch',
        description: 'configure approved suggestions channel or disable it',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel_name',
            description: 'the channel where approved suggestions will be sent',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: 'rejch',
        description: 'configure rejected suggestions channel or disable it',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel_name',
            description: 'the channel where rejected suggestions will be sent',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: 'approve',
        description: 'approve a suggestion',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel_name',
            description: 'the channel where the suggestion exists',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: 'message_id',
            description: 'the message id of the suggestion',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'reason',
            description: 'the reason for the approval',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: 'reject',
        description: 'reject a suggestion',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel_name',
            description: 'the channel where the suggestion exists',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: 'message_id',
            description: 'the message id of the suggestion',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'reason',
            description: 'the reason for the rejection',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    const sub = interaction.options.getSubcommand()
    const settings = data?.settings || {}
    let response

    // status
    if (sub === 'status') {
      const status = interaction.options.getString('status', true)
      response = await setStatus(settings, status)
    }

    // channel
    else if (sub === 'channel') {
      const channel = interaction.options.getChannel(
        'channel_name'
      ) as TextChannel | null
      response = await setChannel(settings, channel)
    }

    // approved channel
    else if (sub === 'appch') {
      const channel = interaction.options.getChannel(
        'channel_name'
      ) as TextChannel | null
      response = await setApprovedChannel(settings, channel)
    }

    // rejected channel
    else if (sub === 'rejch') {
      const channel = interaction.options.getChannel(
        'channel_name'
      ) as TextChannel | null
      response = await setRejectedChannel(settings, channel)
    }

    // approve suggestion
    else if (sub === 'approve') {
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information.')
      }

      const channel = interaction.options.getChannel(
        'channel_name',
        true
      ) as TextChannel
      const messageId = interaction.options.getString('message_id', true)
      const reason =
        interaction.options.getString('reason') || 'No reason provided'
      response = await approveSuggestion(member, channel, messageId, reason)
    }

    // reject suggestion
    else if (sub === 'reject') {
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information.')
      }

      const channel = interaction.options.getChannel(
        'channel_name',
        true
      ) as TextChannel
      const messageId = interaction.options.getString('message_id', true)
      const reason =
        interaction.options.getString('reason') || 'No reason provided'
      response = await rejectSuggestion(member, channel, messageId, reason)
    } else {
      response = 'Not a valid subcommand!'
    }

    await interaction.followUp(response)
  },
}

async function setStatus(settings: any, status: string): Promise<string> {
  const enabled = status.toUpperCase() === 'ON' ? true : false

  if (!settings.suggestions) {
    settings.suggestions = { enabled: false }
  }

  settings.suggestions.enabled = enabled
  await settings.save()
  return `Suggestions system is now ${enabled ? 'enabled' : 'disabled'}!`
}

async function setChannel(
  settings: any,
  channel: TextChannel | null
): Promise<string> {
  if (!channel) {
    if (!settings.suggestions) {
      settings.suggestions = {}
    }
    settings.suggestions.channel_id = null
    await settings.save()
    return 'Suggestions system is now disabled.'
  }

  const me = channel.guild.members.me
  if (!me) {
    return 'Cannot check bot permissions.'
  }

  if (!channel.permissionsFor(me).has(CHANNEL_PERMS)) {
    return `Oopsies! I need these permissions in ${channel} to work properly:\n${parsePermissions(CHANNEL_PERMS)}`
  }

  if (!settings.suggestions) {
    settings.suggestions = {}
  }

  settings.suggestions.channel_id = channel.id
  await settings.save()
  return `Suggestions will now go to ${channel}! Yay! 🎉`
}

async function setApprovedChannel(
  settings: any,
  channel: TextChannel | null
): Promise<string> {
  if (!channel) {
    if (!settings.suggestions) {
      settings.suggestions = {}
    }
    settings.suggestions.approved_channel = null
    await settings.save()
    return 'Approved suggestions channel is now disabled.'
  }

  const me = channel.guild.members.me
  if (!me) {
    return 'Cannot check bot permissions.'
  }

  if (!channel.permissionsFor(me).has(CHANNEL_PERMS)) {
    return `Oopsies! I need these permissions in ${channel} to work properly:\n${parsePermissions(CHANNEL_PERMS)}`
  }

  if (!settings.suggestions) {
    settings.suggestions = {}
  }

  settings.suggestions.approved_channel = channel.id
  await settings.save()
  return `Approved suggestions will now go to ${channel}! Woohoo!`
}

async function setRejectedChannel(
  settings: any,
  channel: TextChannel | null
): Promise<string> {
  if (!channel) {
    if (!settings.suggestions) {
      settings.suggestions = {}
    }
    settings.suggestions.rejected_channel = null
    await settings.save()
    return 'Rejected suggestions channel is now disabled.'
  }

  const me = channel.guild.members.me
  if (!me) {
    return 'Cannot check bot permissions.'
  }

  if (!channel.permissionsFor(me).has(CHANNEL_PERMS)) {
    return `Oopsies! I need these permissions in ${channel} to work properly:\n${parsePermissions(CHANNEL_PERMS)}`
  }

  if (!settings.suggestions) {
    settings.suggestions = {}
  }

  settings.suggestions.rejected_channel = channel.id
  await settings.save()
  return `Rejected suggestions will now go to ${channel}!`
}

export default command
