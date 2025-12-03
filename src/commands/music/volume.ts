import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'volume',
  description: 'set the music player volume',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'amount',
        description: 'enter a value to set [0 to 100]',
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
      return
    }
    const amount = interaction.options.getInteger('amount')
    const response = await getVolume(
      {
        client: interaction.client,
        guildId: interaction.guildId,
      },
      amount
    )
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
): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('music.error.notPlaying'))] }
  }

  if (!amount) {
    return { embeds: [MinaEmbed.info(`volume is at \`${player.volume}%\``)] }
  }

  if (isNaN(amount) || amount < 0 || amount > 100) {
    return { embeds: [MinaEmbed.warning('volume must be between 0 and 100.')] }
  }

  await player.setVolume(amount)
  return {
    embeds: [
      MinaEmbed.success(mina.sayf('music.success.volume', { level: amount })),
    ],
  }
}

export default command
