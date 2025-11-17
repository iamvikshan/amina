import { STATS } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'statstracking',
  description: 'enable or disable tracking stats in the server',
  category: 'UTILITY',
  userPermissions: ['ManageGuild'],
  testGuildOnly: true,

  slashCommand: {
    enabled: STATS.ENABLED,
    ephemeral: true,
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

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    const status = interaction.options.getString('status', true)
    const settings = data?.settings || {}
    const response = await setStatus(status, settings)
    await interaction.followUp(response)
  },
}

async function setStatus(input: string, settings: any) {
  const status = input.toLowerCase() === 'on' ? true : false

  if (!settings.stats) {
    settings.stats = { enabled: false }
  }

  settings.stats.enabled = status
  await settings.save()

  return `Configuration saved! Stats Tracking is now ${status ? 'enabled' : 'disabled'}`
}

export default command
