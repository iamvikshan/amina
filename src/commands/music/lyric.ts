import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { getJson } from '@helpers/HttpUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const BASE_URL = 'https://some-random-api.com/lyrics'

const command: CommandData = {
  name: 'lyric',
  description: 'find lyrics of a song',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        description: 'song name to search',
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('query')
    if (!choice) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('music.error.provideSong'))],
      })
      return
    }
    const response = await getLyric(interaction.user, choice)
    await interaction.followUp(response)
  },
}

async function getLyric(
  user: any,
  choice: string
): Promise<string | { embeds: MinaEmbed[] }> {
  const lyric = await getJson(`${BASE_URL}?title=${choice}`)
  if (!lyric.success) {
    return { embeds: [MinaEmbed.error(mina.say('error'))] }
  }

  const thumbnail = lyric.data?.thumbnail?.genius
  const author = lyric.data?.author
  const lyrics = lyric.data?.lyrics
  const title = lyric.data?.title

  if (!author || !lyrics || !title) {
    return {
      embeds: [
        MinaEmbed.error(mina.sayf('music.error.noResults', { query: choice })),
      ],
    }
  }

  const embed = MinaEmbed.info()
    .setTitle(`${author} - ${title}`)
    .setDescription(
      lyrics.length > 4000 ? lyrics.slice(0, 4000) + '...' : lyrics
    )
    .setFooter({
      text: mina.sayf('generic.requestedBy', { user: user.username }),
    })

  if (thumbnail) {
    embed.setThumbnail(thumbnail)
  }

  return { embeds: [embed] }
}

export default command
