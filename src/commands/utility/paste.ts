import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { postToBin } from '@helpers/HttpUtils'

const command: CommandData = {
  name: 'paste',
  description: 'Paste something in sourceb.in',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'title',
        description: 'title for your content',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'content',
        description: 'content to be posted to bin',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString('title', true)
    const content = interaction.options.getString('content', true)

    if (!title || !content) {
      await interaction.followUp('Please provide both title and content.')
      return
    }

    const response = await paste(content, title)
    await interaction.followUp(response)
    return
  },
}

async function paste(
  content: string,
  title: string
): Promise<{ embeds: EmbedBuilder[] } | string> {
  const response = await postToBin(content, title)
  if (!response) return '❌ Something went wrong'

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Paste links' })
    .setDescription(`🔸 Normal: ${response.url}\n🔹 Raw: ${response.raw}`)

  return { embeds: [embed] }
}

export default command
