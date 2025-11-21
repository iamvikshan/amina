import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'loop',
  description: 'loops the song or queue',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'type',
        type: ApplicationCommandOptionType.String,
        description: 'Select loop type',
        required: false,
        choices: [
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
          { name: 'Off', value: 'off' },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type') || 'track'
    const response = await toggleLoop(interaction, type)
    await interaction.followUp(response)
  },
}

async function toggleLoop(
  {
    client,
    guildId,
  }: {
    client: any
    guildId: string
  },
  type: string
): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return '🚫 No song is currently playing'
  }

  switch (type) {
    case 'track':
      player.setRepeatMode('track')
      return 'Loop mode is set to `track`'

    case 'queue':
      if (player.queue.tracks.length > 1) {
        player.setRepeatMode('queue')
        return 'Loop mode is set to `queue`'
      } else {
        return '🚫 Queue is too short to be looped'
      }

    case 'off':
      player.setRepeatMode('off')
      return 'Loop mode is disabled'

    default:
      return 'Invalid loop type'
  }
}

export default command
