import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'pause',
  description: 'Pause the music player',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await pause(interaction)
    await interaction.followUp(response)
  },
}

async function pause({
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

  if (player.paused) {
    return 'The player is already paused'
  }

  player.pause()
  return '⏸️ Paused the music player'
}

export default command
