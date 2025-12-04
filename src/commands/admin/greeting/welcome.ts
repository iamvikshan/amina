import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'
// CommandData is globally available - see types/commands.d.ts
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
  name: 'welcome',
  description: 'configure an automatic greeting message for new members',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'status',
        description: 'turn welcome messages on or off',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'on or off',
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
        description: 'see how the welcome message will look',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'channel',
        description: 'set where welcome messages are sent',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel for welcome messages',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'desc',
        description: 'set the welcome embed description text',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'content',
            description: 'description text with placeholders like {user}',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'thumbnail',
        description: 'toggle the user avatar thumbnail',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'on or off',
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
        description: 'set the embed sidebar color',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'hex-code',
            description: 'hex color code like #FF5733',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'footer',
        description: 'set the embed footer text',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'content',
            description: 'footer text to display',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'image',
        description: 'set a large image for the embed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'url',
            description: 'direct url to the image',
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
          'WELCOME'
        )
        break

      case 'status':
        response = await setStatus(
          settings,
          interaction.options.getString('status', true),
          'WELCOME'
        )
        break

      case 'channel':
        response = await setChannel(
          settings,
          interaction.options.getChannel('channel', true) as TextChannel,
          'WELCOME'
        )
        break

      case 'desc':
        response = await setDescription(
          settings,
          interaction.options.getString('content', true),
          'WELCOME'
        )
        break

      case 'thumbnail':
        response = await setThumbnail(
          settings,
          interaction.options.getString('status', true),
          'WELCOME'
        )
        break

      case 'color':
        response = await setColor(
          settings,
          interaction.options.getString('hex-code', true),
          'WELCOME'
        )
        break

      case 'footer':
        response = await setFooter(
          settings,
          interaction.options.getString('content', true),
          'WELCOME'
        )
        break

      case 'image':
        response = await setImage(
          settings,
          interaction.options.getString('url', true),
          'WELCOME'
        )
        break

      default:
        response = "Oopsie! That's an invalid subcommand. Please try again! 🥺"
    }

    await interaction.followUp(response)
  },
}

export default command
