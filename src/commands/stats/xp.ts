import { STATS } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'

const command: CommandData = {
  name: 'levelup',
  description: 'configure the levelling system',
  category: 'UTILITY',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: STATS.ENABLED,
    options: [
      {
        name: 'message',
        description: 'set custom level up message',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message',
            description: 'message to display when a user levels up',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'channel',
        description: 'set the channel to send level up messages to',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel to send level up messages to',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
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

    if (sub === 'message') {
      const message = interaction.options.getString('message', true)
      response = await setMessage(message, settings)
    } else if (sub === 'channel') {
      const channel = interaction.options.getChannel(
        'channel',
        true
      ) as TextChannel
      response = await setChannel(channel, settings)
    } else {
      response = 'Invalid subcommand'
    }

    await interaction.followUp(response)
  },
}

async function setMessage(message: string, settings: any) {
  if (!message) return 'Invalid message. Please provide a message'

  if (!settings.stats) {
    settings.stats = { enabled: false, xp: { message: '', channel: null } }
  }
  if (!settings.stats.xp) {
    settings.stats.xp = { message: '', channel: null }
  }

  settings.stats.xp.message = message
  await settings.save()
  return `Configuration saved. Level up message updated!`
}

async function setChannel(channel: TextChannel, settings: any) {
  if (!channel) return 'Invalid channel. Please provide a channel'

  if (!settings.stats) {
    settings.stats = { enabled: false, xp: { message: '', channel: null } }
  }
  if (!settings.stats.xp) {
    settings.stats.xp = { message: '', channel: null }
  }

  settings.stats.xp.channel = channel.id
  await settings.save()
  return `Configuration saved. Level up channel updated!`
}

export default command
