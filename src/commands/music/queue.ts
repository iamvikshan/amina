import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'queue',
  description: 'view the list of upcoming tracks in the queue',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'page',
        description: 'page number',
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const page = interaction.options.getInteger('page')
    const response = await getQueue(interaction as any, page)
    await interaction.followUp(response)
  },
}

async function getQueue(
  {
    client,
    guild,
  }: {
    client: any
    guild: any
  },
  pgNo: number | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guild.id)
  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('music.error.notPlaying'))] }
  }

  const embed = MinaEmbed.secondary().setAuthor({
    name: mina.sayf('music.success.queue.title', { server: guild.name }),
  })

  const pageNumber = pgNo ?? 1
  const end = pageNumber * 10
  const start = end - 10

  const tracks = player.queue.tracks.slice(start, end)

  if (player.queue.current) {
    const current = player.queue.current
    embed
      .addFields({
        name: mina.say('music.success.queue.nowPlaying'),
        value: `[${current.info.title}](${current.info.uri}) \`[${client.utils.formatTime(current.info.duration)}]\``,
      })
      .setThumbnail(current.info.artworkUrl)
  }

  const queueList = tracks.map(
    (track: any, index: number) =>
      `${start + index + 1}. [${track.info.title}](${track.info.uri}) \`[${client.utils.formatTime(track.info.duration)}]\``
  )

  embed.setDescription(
    queueList.length
      ? queueList.join('\n')
      : pageNumber > 1
        ? mina.sayf('music.success.queue.emptyPage', {
            page: pageNumber.toString(),
          })
        : mina.say('music.empty')
  )

  const maxPages = Math.ceil(player.queue.tracks.length / 10)
  embed.setFooter({
    text: mina.sayf('generic.pagination', {
      current: (pageNumber > maxPages ? maxPages : pageNumber).toString(),
      total: maxPages.toString(),
    }),
  })

  return { embeds: [embed] }
}

export default command
