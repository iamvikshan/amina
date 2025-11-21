import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'skip',
  description: 'Skip the current song',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await skip(interaction)
    await interaction.followUp(response)
  },
}

async function skip({
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

  const title = player.queue.current.info.title

  if (player.queue.tracks.length === 0) {
    return 'There is no next song to skip to'
  }

  await player.skip()
  return `⏯️ ${title} was skipped`
}

export default command
