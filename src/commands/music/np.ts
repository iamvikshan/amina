import { ChatInputCommandInteraction } from 'discord.js'
import { splitBar } from 'string-progressbar'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'np',
  description: 'shows what track is currently being played',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = nowPlaying(interaction as any)
    await interaction.followUp(response)
  },
}

function nowPlaying({
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

  const track = player.queue.current
  const end =
    track.info.duration > 6.048e8
      ? mina.say('music.success.queue.live')
      : client.utils.formatTime(track.info.duration)

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('music.success.queue.nowPlaying') })
    .setDescription(`[${track.info.title}](${track.info.uri})`)
    .addFields(
      {
        name: mina.say('music.success.queue.duration'),
        value: client.utils.formatTime(track.info.duration),
        inline: true,
      },
      {
        name: mina.say('generic.requestedByLabel'),
        value:
          track.requester?.username || mina.say('music.success.queue.unknown'),
        inline: true,
      },
      {
        name: '\u200b',
        value:
          client.utils.formatTime(player.position) +
          ' [' +
          splitBar(
            track.info.duration > 6.048e8
              ? player.position
              : track.info.duration,
            player.position,
            15
          )[0] +
          '] ' +
          end,
        inline: false,
      }
    )

  return { embeds: [embed] }
}

export default command
