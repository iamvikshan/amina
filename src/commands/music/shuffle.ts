import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'shuffle',
  description: 'randomize the order of tracks in the queue',
  category: 'MUSIC',
  validations: musicValidations,
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = shuffle(interaction as any)
    await interaction.followUp(response)
  },
}

function shuffle({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): string | { embeds: MinaEmbed[] } {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('music.error.notPlaying'))] }
  }

  if (player.queue.tracks.length < 2) {
    return { embeds: [MinaEmbed.warning('not enough tracks to shuffle.')] }
  }

  player.queue.shuffle()
  return { embeds: [MinaEmbed.success(mina.say('music.success.shuffled'))] }
}

export default command
