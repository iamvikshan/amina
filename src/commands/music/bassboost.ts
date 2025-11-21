import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { EQList } from 'lavalink-client'

const command: CommandData = {
  name: 'bassboost',
  description: 'Set bassboost level',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'level',
        description: 'bassboost level',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'High', value: 'high' },
          { name: 'Medium', value: 'medium' },
          { name: 'Low', value: 'low' },
          { name: 'Off', value: 'off' },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const level = interaction.options.getString('level')
    if (!level) {
      return await interaction.followUp('🚫 Please select a bassboost level')
    }
    const response = await setBassBoost(interaction, level)
    await interaction.followUp(response)
  },
}

async function setBassBoost(
  {
    client,
    guildId,
  }: {
    client: any
    guildId: string
  },
  level: string
): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return '🚫 No song is currently playing'
  }

  switch (level) {
    case 'high':
      await player.filterManager.clearEQ()
      await player.filterManager.setEQ(EQList.BassboostHigh)
      break
    case 'medium':
      await player.filterManager.clearEQ()
      await player.filterManager.setEQ(EQList.BassboostMedium)
      break
    case 'low':
      await player.filterManager.clearEQ()
      await player.filterManager.setEQ(EQList.BassboostLow)
      break
    case 'off':
      await player.filterManager.clearEQ()
      break
    default:
      return 'Invalid bassboost level'
  }

  return `> Set the bassboost level to \`${level}\``
}

export default command
