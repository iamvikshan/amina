import { ChatInputCommandInteraction } from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import { splitBar } from 'string-progressbar'
import config from '@src/config'

const command: CommandData = {
  name: 'np',
  description: 'Shows what track is currently being played',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = nowPlaying(interaction)
    await interaction.followUp(response)
  },
}

function nowPlaying({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): string | { embeds: EmbedBuilder[] } {
  const player = client.musicManager.getPlayer(guildId)
  if (!player || !player.queue.current) {
    return '🚫 No music is being played!'
  }

  const track = player.queue.current
  const end =
    track.info.duration > 6.048e8
      ? '🔴 LIVE'
      : client.utils.formatTime(track.info.duration)

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: 'Now Playing' })
    .setDescription(`[${track.info.title}](${track.info.uri})`)
    .addFields(
      {
        name: 'Song Duration',
        value: client.utils.formatTime(track.info.duration),
        inline: true,
      },
      {
        name: 'Requested By',
        value: track.requester?.username || 'Unknown',
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
