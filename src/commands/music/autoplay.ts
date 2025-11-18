import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { autoplayFunction } from '@handlers/player'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'autoplay',
  description: 'Toggle autoplay feature for music player',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await toggleAutoplay(interaction)
    await interaction.followUp(response)
  },
}

async function toggleAutoplay({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return '🚫 No song is currently playing'
  }

  const autoplayState = player.get('autoplay')

  if (autoplayState) {
    player.set('autoplay', false)
    return 'Autoplay deactivated'
  }

  player.set('autoplay', true)
  try {
    await autoplayFunction(client, player.queue.current, player)
  } catch (error: any) {
    client.logger?.error('Autoplay Error', error)
    player.set('autoplay', false)
    return '🚫 Failed to activate autoplay'
  }

  return 'Autoplay activated!'
}

export default command
