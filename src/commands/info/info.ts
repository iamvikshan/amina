import user from './shared/user'
import channelInfo from './shared/channel'
import guildInfo from './shared/guild'
import avatar from './shared/avatar'
import emojiInfo from './shared/emoji'
import profileView from './shared/profile'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'info',
  description: 'view details about users, channels, server, avatars, or emojis',
  category: 'INFO',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'user',
        description: 'view account info, roles, and join date',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'the user to look up',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'channel',
        description: 'view channel details like type, topic, and creation date',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'the channel to look up',
            type: ApplicationCommandOptionType.Channel,
            required: false,
          },
        ],
      },
      {
        name: 'guild',
        description: 'view server stats, owner, boost level, and features',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'avatar',
        description: "view a user's avatar in full resolution",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'the user whose avatar to display',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'emoji',
        description: 'view emoji details like id, name, and creation date',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'the emoji to look up',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'profile',
        description: "view your or someone else's profile",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to view, leave empty for yourself',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response

    // user
    if (sub === 'user') {
      const targetUser = interaction.options.getUser('name') || interaction.user
      if (!interaction.guild) {
        return interaction.followUp(mina.say('serverOnly'))
      }
      try {
        const target = await interaction.guild.members.fetch(targetUser.id)
        response = user(target)
      } catch (_ex) {
        response = mina.say('infoCmd.user.error.fetchFailed')
      }
    }

    // channel
    else if (sub === 'channel') {
      if (!interaction.guild) {
        return interaction.followUp(mina.say('serverOnly'))
      }
      const targetChannel =
        interaction.options.getChannel('name') || interaction.channel
      if (!targetChannel || !('guild' in targetChannel)) {
        return interaction.followUp(mina.say('notFound.channel'))
      }
      response = channelInfo(targetChannel as any)
    }

    // guild
    else if (sub === 'guild') {
      if (!interaction.guild) {
        return interaction.followUp(mina.say('serverOnly'))
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
        return interaction.followUp(mina.say('infoCmd.emoji.error.invalid'))
      }
      response = emojiInfo(emoji)
    }

    // profile
    else if (sub === 'profile') {
      const target = interaction.options.getUser('user') || interaction.user
      return profileView(interaction, target)
    }

    // return
    else {
      response = mina.say('error.generic')
    }

    await interaction.followUp(response)
    return
  },
}

export default command
