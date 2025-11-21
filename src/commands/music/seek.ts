import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'

const command: CommandData = {
  name: 'seek',
  description: 'Sets the position of the current track',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'time',
        description: 'The time you want to seek to',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const timeString = interaction.options.getString('time')
    if (!timeString) {
      return await interaction.followUp(
        'Invalid time format. Use 10s, 1m 50s, 1h'
      )
    }

    const time = (interaction.client as any).utils.parseTime(timeString)
    if (!time) {
      return await interaction.followUp(
        'Invalid time format. Use 10s, 1m 50s, 1h'
      )
    }

    const response = await seekTo(interaction, time)
    await interaction.followUp(response)
  },
}

async function seekTo(
  {
    client,
    guildId,
  }: {
    client: any
    guildId: string
  },
  time: number
): Promise<string> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return "🚫 There's no music currently playing"
  }

  if (time > player.queue.current.info.duration) {
    return 'The duration you provided exceeds the duration of the current track'
  }

  player.seek(time)
  return `Seeked song duration to **${client.utils.formatTime(time)}**`
}

export default command
