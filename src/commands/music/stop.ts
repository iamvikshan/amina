import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'stop',
  description: 'Stop the music player',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await stop(interaction)
    await interaction.followUp(response)
  },
}

async function stop({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return "🚫 There's no music currently playing"
  }

  if (player.get('autoplay') === true) {
    player.set('autoplay', false)
  }

  player.stopPlaying(true, false)

  return '🎶 The music player is stopped, and the queue has been cleared'
}

export default command
