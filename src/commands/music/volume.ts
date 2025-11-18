import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'volume',
  description: 'Set the music player volume',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'amount',
        description: 'Enter a value to set [0 to 100]',
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount')
    const response = await getVolume(interaction, amount)
    await interaction.followUp(response)
  },
}

async function getVolume(
  {
    client,
    guildId,
  }: {
    client: any
    guildId: string
  },
  amount: number | null
): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return "🚫 There's no music currently playing"
  }

  if (!amount) return `> The player volume is \`${player.volume}\``

  if (isNaN(amount) || amount < 0 || amount > 100) {
    return 'You need to give me a volume between 0 and 100'
  }

  await player.setVolume(amount)
  return `🎶 Music player volume is set to \`${amount}\``
}

export default command
