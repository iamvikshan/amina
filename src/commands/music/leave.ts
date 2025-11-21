import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'leave',
  description: 'Disconnects the bot from the voice channel',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await leave(interaction)
    await interaction.followUp(response)
  },
}

async function leave({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player) {
    return '🚫 I am not in a voice channel'
  }

  player.destroy()
  return '👋 Disconnected from the voice channel'
}

export default command
