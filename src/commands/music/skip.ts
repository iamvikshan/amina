import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'skip',
  description: 'skip the current song',
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
    const response = await skip({
      client: interaction.client,
      guildId: interaction.guildId,
    })
    return interaction.followUp(response)
  },
}

async function skip({
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

  const title = player.queue.current.info.title

  if (player.queue.tracks.length === 0) {
    return { embeds: [MinaEmbed.warning(mina.say('music.empty'))] }
  }

  await player.skip()
  return {
    embeds: [MinaEmbed.success(mina.sayf('music.skip', { track: title }))],
  }
}

export default command
