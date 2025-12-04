import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { AUTOMOD } from '@src/config'

const command: CommandData = {
  name: 'autodelete',
  description: 'auto-remove messages with attachments, invites, or links',
  category: 'AUTOMOD',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: AUTOMOD.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'attachments',
        description: 'delete messages with file attachments',
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
        name: 'invites',
        description: 'delete messages with discord invite links',
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
        name: 'links',
        description: 'delete messages containing any urls',
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
        name: 'maxlines',
        description: 'delete messages exceeding a line limit',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'max lines per message, 0 to disable',
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const sub = interaction.options.getSubcommand()
    const settings = data.settings
    let response: string

    if (sub === 'attachments') {
      response = await antiAttachments(
        settings,
        interaction.options.getString('status', true)
      )
    } else if (sub === 'invites') {
      response = await antiInvites(
        settings,
        interaction.options.getString('status', true)
      )
    } else if (sub === 'links') {
      response = await antiLinks(
        settings,
        interaction.options.getString('status', true)
      )
    } else if (sub === 'maxlines') {
      response = await maxLines(
        settings,
        interaction.options.getInteger('amount', true)
      )
    } else {
      response = 'Oops! Invalid command usage! Please check and try again!'
    }

    await interaction.followUp(response)
  },
}

async function antiAttachments(settings: any, input: string): Promise<string> {
  const status = input.toUpperCase() === 'ON'
  settings.automod.anti_attachments = status
  await settings.save()
  return `Messages ${status ? 'with attachments will now be automatically deleted!' : 'will not be filtered for attachments anymore!'}`
}

async function antiInvites(settings: any, input: string): Promise<string> {
  const status = input.toUpperCase() === 'ON'
  settings.automod.anti_invites = status
  await settings.save()
  return `Messages ${status ? 'with Discord invites will now be automatically deleted!' : 'will not be filtered for Discord invites anymore!'}`
}

async function antiLinks(settings: any, input: string): Promise<string> {
  const status = input.toUpperCase() === 'ON'
  settings.automod.anti_links = status
  await settings.save()
  return `Messages ${status ? 'with links will now be automatically deleted!' : 'will not be filtered for links anymore!'}`
}

async function maxLines(settings: any, input: number): Promise<string> {
  const lines = Number.parseInt(input.toString())
  if (isNaN(lines)) return 'Please enter a valid number!'

  settings.automod.max_lines = lines
  await settings.save()
  return `${input === 0 ? 'Maximum line limit is now disabled!' : `Messages longer than \`${input}\` lines will now be automatically deleted!`}`
}

export default command
