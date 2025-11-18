import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'resume',
  description: 'Resumes the music player',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await resumePlayer(interaction)
    await interaction.followUp(response)
  },
}

async function resumePlayer({
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

  if (!player.paused) return 'The player is already resumed'

  player.resume()
  return '▶️ Resumed the music player'
}

export default command
