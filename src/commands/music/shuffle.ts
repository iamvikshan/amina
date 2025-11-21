import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'shuffle',
  description: 'shuffle the queue',
  category: 'MUSIC',
  validations: musicValidations,
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = shuffle(interaction)
    await interaction.followUp(response)
  },
}

function shuffle({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): string {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return "🚫 There's no music currently playing"
  }

  if (player.queue.tracks.length < 2) {
    return '🚫 Not enough tracks to shuffle'
  }

  player.queue.shuffle()
  return '🎶 Queue has been shuffled'
}

export default command
