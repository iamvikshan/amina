import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} from 'discord.js'
import { getJson } from '@helpers/HttpUtils'
import config from '@src/config'

const BASE_URL = 'https://some-random-api.com/lyrics'

const command: CommandData = {
  name: 'lyric',
  description: 'find lyric of the song',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        description: 'find lyric of the song',
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('query')
    if (!choice) {
      return await interaction.followUp('🚫 Please provide a song name')
    }
    const response = await getLyric(interaction.user, choice)
    await interaction.followUp(response)
  },
}

async function getLyric(
  user: any,
  choice: string
): Promise<string | { embeds: EmbedBuilder[] }> {
  const lyric = await getJson(`${BASE_URL}?title=${choice}`)
  if (!lyric.success) return config.MESSAGES.API_ERROR

  const thumbnail = lyric.data?.thumbnail?.genius
  const author = lyric.data?.author
  const lyrics = lyric.data?.lyrics
  const title = lyric.data?.title

  if (!author || !lyrics || !title) {
    return '🚫 Could not find lyrics for this song'
  }

  const embed = new EmbedBuilder()
  embed
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setTitle(`${author} - ${title}`)
    .setDescription(lyrics)
    .setFooter({ text: `Request By: ${user.username}` })

  if (thumbnail) {
    embed.setThumbnail(thumbnail)
  }

  return { embeds: [embed] }
}

export default command
