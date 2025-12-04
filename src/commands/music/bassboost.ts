import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { EQList } from 'lavalink-client'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'bassboost',
  description: 'adjust the bass level from off to high',
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
          { name: 'high', value: 'high' },
          { name: 'medium', value: 'medium' },
          { name: 'low', value: 'low' },
          { name: 'off', value: 'off' },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const level = interaction.options.getString('level')
    if (!level) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('error.selectLevel'))],
      })
      return
    }
    const response = await setBassBoost(interaction as any, level)
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
): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('error.notPlaying'))] }
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
      return { embeds: [MinaEmbed.error(mina.say('error.invalidLevel'))] }
  }

  return {
    embeds: [
      MinaEmbed.success(mina.sayf('music.success.bassboostSet', { level })),
    ],
  }
}

export default command
