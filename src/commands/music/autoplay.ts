import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { autoplayFunction } from '@handlers/player'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'autoplay',
  description: 'toggle automatic song recommendations when queue ends',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
    }
    const response = await toggleAutoplay({
      client: interaction.client,
      guildId: interaction.guildId,
    })
    return interaction.followUp(response)
  },
}

async function toggleAutoplay({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('error.notPlaying'))] }
  }

  const autoplayState = player.get('autoplay')

  if (autoplayState) {
    player.set('autoplay', false)
    return { embeds: [MinaEmbed.info('autoplay off.')] }
  }

  player.set('autoplay', true)
  try {
    await autoplayFunction(client, player.queue.current, player)
  } catch (error: any) {
    client.logger?.error('Autoplay Error', error)
    player.set('autoplay', false)
    return { embeds: [MinaEmbed.error('failed to activate autoplay.')] }
  }

  return { embeds: [MinaEmbed.success('autoplay on.')] }
}

export default command
