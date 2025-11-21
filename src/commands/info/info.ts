import user from './shared/user'
import channelInfo from './shared/channel'
import guildInfo from './shared/guild'
import avatar from './shared/avatar'
import emojiInfo from './shared/emoji'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'

const command: CommandData = {
  name: 'info',
  description: 'show various information',
  category: 'INFO',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'user',
        description: 'get user information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'name of the user',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'channel',
        description: 'get channel information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'name of the channel',
            type: ApplicationCommandOptionType.Channel,
            required: false,
          },
        ],
      },
      {
        name: 'guild',
        description: 'get guild information',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'avatar',
        description: 'displays avatar information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'name of the user',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'emoji',
        description: 'displays emoji information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'name of the emoji',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    if (!sub) return interaction.followUp('Not a valid subcommand')
    let response

    // user
    if (sub === 'user') {
      const targetUser = interaction.options.getUser('name') || interaction.user
      if (!interaction.guild) {
        return interaction.followUp(
          'This command can only be used in a server.'
        )
      }
      try {
        const target = await interaction.guild.members.fetch(targetUser.id)
        response = user(target)
      } catch (ex) {
        response =
          'Failed to fetch user information. The user might not be in this server.'
      }
    }

    // channel
    else if (sub === 'channel') {
      if (!interaction.guild) {
        return interaction.followUp(
          'This command can only be used in a server.'
        )
      }
      const targetChannel =
        interaction.options.getChannel('name') || interaction.channel
      if (!targetChannel || !('guild' in targetChannel)) {
        return interaction.followUp('Invalid channel specified.')
      }
      response = channelInfo(targetChannel as any)
    }

    // guild
    else if (sub === 'guild') {
      if (!interaction.guild) {
        return interaction.followUp(
          'This command can only be used in a server.'
        )
      }
      response = await guildInfo(interaction.guild)
    }

    // avatar
    else if (sub === 'avatar') {
      const target = interaction.options.getUser('name') || interaction.user
      response = avatar(target)
    }

    // emoji
    else if (sub === 'emoji') {
      const emoji = interaction.options.getString('name')
      if (!emoji) {
        return interaction.followUp('Please provide an emoji name.')
      }
      response = emojiInfo(emoji)
    }

    // return
    else {
      response = 'Incorrect subcommand'
    }

    await interaction.followUp(response)
    return
  },
}

export default command
