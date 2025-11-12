import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'
import type { CommandData } from '@src/structures/Command'
import {
  sendPreview,
  setStatus,
  setChannel,
  setDescription,
  setThumbnail,
  setColor,
  setFooter,
  setImage,
} from './utils'

const command: CommandData = {
  name: 'farewell',
  description: 'Set up a farewell message for your server!',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'status',
        description: 'Enable or disable the farewell message',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'Choose ON or OFF',
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
        name: 'preview',
        description: 'Preview the configured farewell message!',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'channel',
        description: 'Set the channel for farewell messages',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'Select a channel',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'desc',
        description: 'Set the embed description for the farewell message',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'content',
            description: 'What would you like the description to say?',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'thumbnail',
        description: 'Configure the embed thumbnail',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'Thumbnail status (ON/OFF)',
            type: ApplicationCommandOptionType.String,
            required: true,
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
        name: 'color',
        description: 'Set the embed color for your farewell message',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'hex-code',
            description: 'Enter the hex color code (e.g., #FF5733)',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'footer',
        description: 'Set the footer for the farewell embed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'content',
            description: 'What should the footer say?',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'image',
        description: 'Set an image for the farewell embed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'url',
            description: 'Enter the image URL',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: any
  ): Promise<void> {
    const sub = interaction.options.getSubcommand()
    const settings = data.settings

    let response: string

    switch (sub) {
      case 'preview':
        response = await sendPreview(
          settings,
          interaction.member as any,
          'FAREWELL'
        )
        break

      case 'status':
        response = await setStatus(
          settings,
          interaction.options.getString('status', true),
          'FAREWELL'
        )
        break

      case 'channel':
        response = await setChannel(
          settings,
          interaction.options.getChannel('channel', true) as TextChannel,
          'FAREWELL'
        )
        break

      case 'desc':
        response = await setDescription(
          settings,
          interaction.options.getString('content', true),
          'FAREWELL'
        )
        break

      case 'thumbnail':
        response = await setThumbnail(
          settings,
          interaction.options.getString('status', true),
          'FAREWELL'
        )
        break

      case 'color':
        response = await setColor(
          settings,
          interaction.options.getString('hex-code', true),
          'FAREWELL'
        )
        break

      case 'footer':
        response = await setFooter(
          settings,
          interaction.options.getString('content', true),
          'FAREWELL'
        )
        break

      case 'image':
        response = await setImage(
          settings,
          interaction.options.getString('url', true),
          'FAREWELL'
        )
        break

      default:
        response = "Oopsie! That's an invalid subcommand. Please try again! 🥺"
    }

    await interaction.followUp(response)
  },
}

export default command
