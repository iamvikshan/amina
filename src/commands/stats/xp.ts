import { STATS } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'levelup',
  description: 'customize level up messages and set notification channel',
  category: 'UTILITY',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: STATS.ENABLED,
    options: [
      {
        name: 'message',
        description: 'customize the level up notification text',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message',
            description: 'text with placeholders like {user} and {level}',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'channel',
        description: 'set where level up messages are sent',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel for level up announcements',
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
      response = mina.say('statsCmd.error.invalidSubcommand')
    }

    await interaction.followUp(response)
  },
}

async function setMessage(message: string, settings: any) {
  if (!message) return mina.say('statsCmd.error.invalidMessage')

  if (!settings.stats) {
    settings.stats = { enabled: false, xp: { message: '', channel: null } }
  }
  if (!settings.stats.xp) {
    settings.stats.xp = { message: '', channel: null }
  }

  settings.stats.xp.message = message
  await settings.save()
  return mina.say('statsCmd.config.messageUpdated')
}

async function setChannel(channel: TextChannel, settings: any) {
  if (!channel) return mina.say('statsCmd.error.invalidChannel')

  if (!settings.stats) {
    settings.stats = { enabled: false, xp: { message: '', channel: null } }
  }
  if (!settings.stats.xp) {
    settings.stats.xp = { message: '', channel: null }
  }

  settings.stats.xp.channel = channel.id
  await settings.save()
  return mina.say('statsCmd.config.channelUpdated')
}

export default command
