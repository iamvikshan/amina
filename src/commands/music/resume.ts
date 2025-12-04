import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'resume',
  description: 'resume playback of a paused track',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
    }
    const response = await resumePlayer({
      client: interaction.client,
      guildId: interaction.guildId,
    })
    return interaction.followUp(response)
  },
}

async function resumePlayer({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('music.error.notPlaying'))] }
  }

  if (!player.paused) {
    return { embeds: [MinaEmbed.warning('already playing.')] }
  }

  player.resume()
  return { embeds: [MinaEmbed.success(mina.say('music.resume'))] }
}

export default command
