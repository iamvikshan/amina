import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import listservers from './sub/listServers'
import leaveserver from './sub/leaveServer'
import execCommand from './sub/exec'
import { addTod, delTod } from './sub/tod'
import trigSettings from './sub/trigSettings'
import reload from './sub/reload'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'dev',
  description: 'Developer-only commands',
  category: 'DEV',
  botPermissions: ['EmbedLinks'],
  devOnly: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'listservers',
        description: 'Get a list of servers the bot is in',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'leaveserver',
        description: 'Leave a server',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'serverid',
            description: 'ID of the server to leave',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'add-tod',
        description: 'Add a Truth or Dare question',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'category',
            description: 'Category of the question',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: 'Truth', value: 'truth' },
              { name: 'Dare', value: 'dare' },
              { name: 'Paranoia', value: 'paranoia' },
              { name: 'Never Have I Ever', value: 'nhie' },
              { name: 'Would You Rather', value: 'wyr' },
              { name: 'Have You Ever', value: 'hye' },
              { name: 'What Would You Do', value: 'wwyd' },
            ],
          },
          {
            name: 'question',
            description: 'The question to add',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'rating',
            description: 'Parental rating of the question',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: 'PG - General Audience', value: 'PG' },
              { name: 'PG-13 - Teen', value: 'PG-13' },
              { name: 'PG-16 - Mature Teen', value: 'PG-16' },
              { name: 'R - Mature', value: 'R' },
            ],
          },
        ],
      },
      {
        name: 'del-tod',
        description: 'Delete a Truth or Dare question by ID',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'question_id',
            description: 'ID of the question to delete (e.g., T1, D2, NHIE3)',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'exec',
        description: 'Execute something on terminal',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'script',
            description: 'Script to execute',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'trig-settings',
        description: 'Trigger settings for servers',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'serverid',
            description: 'ID of the server to trigger settings (optional)',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: 'reload',
        description: "Reloads a command that's been modified",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: 'Type of command to reload',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: 'Commands', value: 'commands' },
              { name: 'Events', value: 'events' },
              { name: 'Contexts', value: 'contexts' },
              { name: 'All', value: 'all' },
            ],
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()

    switch (sub) {
      case 'listservers':
        await listservers(interaction)
        break
      case 'leaveserver':
        await leaveserver(interaction)
        break
      case 'exec':
        await execCommand(interaction)
        break
      case 'add-tod':
        await addTod(interaction)
        break
      case 'del-tod':
        await delTod(interaction)
        break
      case 'trig-settings':
        await trigSettings(interaction)
        break
      case 'reload':
        await reload(interaction)
        break
      default:
        await interaction.followUp('Not a valid subcommand')
    }
  },
}

export default command
