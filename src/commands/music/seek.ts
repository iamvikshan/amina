import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'seek',
  description: 'jump to a specific timestamp in the current track',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'time',
        description: 'the time you want to seek to',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const timeString = interaction.options.getString('time')
    if (!timeString) {
      await interaction.followUp({
        embeds: [MinaEmbed.warning(mina.say('error.invalidTimeFormat'))],
      })
      return
    }

    const time = (interaction.client as any).utils.parseTime(timeString)
    if (!time) {
      await interaction.followUp({
        embeds: [MinaEmbed.warning(mina.say('error.invalidTimeFormat'))],
      })
      return
    }

    const response = await seekTo(interaction as any, time)
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
): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('error.notPlaying'))] }
  }

  if (time > player.queue.current.info.duration) {
    return { embeds: [MinaEmbed.warning('time exceeds track duration.')] }
  }

  player.seek(time)
  return {
    embeds: [
      MinaEmbed.success(`seeked to **${client.utils.formatTime(time)}**.`),
    ],
  }
}

export default command
