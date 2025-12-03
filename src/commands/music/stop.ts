import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'stop',
  description: 'stop the music player',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await stop(interaction as any)
    await interaction.followUp(response)
  },
}

async function stop({
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

  if (player.get('autoplay') === true) {
    player.set('autoplay', false)
  }

  player.stopPlaying(true, false)

  return { embeds: [MinaEmbed.success(mina.say('music.stop'))] }
}

export default command
