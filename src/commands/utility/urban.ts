import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MESSAGES, EMBED_COLORS } from '@src/config'
import { getJson } from '@helpers/HttpUtils'
import moment from 'moment'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'urban',
  description: 'searches the urban dictionary',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'word',
        description: 'the word for which you want to urban meaning',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const word = interaction.options.getString('word', true)
    const response = await urban(word)
    await interaction.followUp(response)
  },
}

async function urban(
  word: string
): Promise<{ embeds: EmbedBuilder[] } | string> {
  const response = await getJson(
    `http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`
  )
  if (!response.success) return MESSAGES.API_ERROR

  const json = response.data
  if (!json || !json.list || !json.list[0])
    return `Nothing found matching \`${word}\``

  const data = json.list[0]

  // Truncate description if too long (Discord limit is 4096)
  let definition = data.definition || ''
  if (definition.length > 4000) {
    definition = definition.substring(0, 4000) + '...'
  }

  // Truncate example if too long
  let example = data.example || ''
  if (example.length > 1000) {
    example = example.substring(0, 1000) + '...'
  }

  const embed = new EmbedBuilder()
    .setTitle(data.word)
    .setURL(data.permalink)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`**Definition**\`\`\`css\n${definition}\`\`\``)
    .addFields(
      {
        name: 'Author',
        value: data.author || 'Unknown',
        inline: true,
      },
      {
        name: 'ID',
        value: data.defid?.toString() || 'N/A',
        inline: true,
      },
      {
        name: 'Likes / Dislikes',
        value: `👍 ${data.thumbs_up || 0} | 👎 ${data.thumbs_down || 0}`,
        inline: true,
      },
      {
        name: 'Example',
        value: example || 'No example provided',
        inline: false,
      }
    )

  if (data.written_on) {
    embed.setFooter({ text: `Created ${moment(data.written_on).fromNow()}` })
  }

  return { embeds: [embed] }
}

export default command
