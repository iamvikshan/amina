import { STATS } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'statstracking',
  description: 'enable or disable tracking stats in the server',
  category: 'UTILITY',
  userPermissions: ['ManageGuild'],

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
            name: 'on',
            value: 'ON',
          },
          {
            name: 'off',
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

  return status
    ? mina.say('statsCmd.config.enabled')
    : mina.say('statsCmd.config.disabled')
}

export default command
