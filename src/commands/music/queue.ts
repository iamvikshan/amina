import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import config from '@src/config'

const command: CommandData = {
  name: 'queue',
  description: 'displays the current music queue',
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
    const response = await getQueue(interaction, page)
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
): Promise<string | { embeds: EmbedBuilder[] }> {
  const player = client.musicManager.getPlayer(guild.id)
  if (!player || !player.queue.current) {
    return '🚫 No song is currently playing'
  }

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `Queue for ${guild.name}` })

  const pageNumber = pgNo ?? 1
  const end = pageNumber * 10
  const start = end - 10

  const tracks = player.queue.tracks.slice(start, end)

  if (player.queue.current) {
    const current = player.queue.current
    embed
      .addFields({
        name: 'Current',
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
      : `No tracks in ${pageNumber > 1 ? `page ${pageNumber}` : 'the queue'}.`
  )

  const maxPages = Math.ceil(player.queue.tracks.length / 10)
  embed.setFooter({
    text: `Page ${pageNumber > maxPages ? maxPages : pageNumber} of ${maxPages}`,
  })

  return { embeds: [embed] }
}

export default command
