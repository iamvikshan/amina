import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { postToBin } from '@helpers/HttpUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'paste',
  description: 'upload text or code to sourceb.in and get a shareable link',
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
      await interaction.followUp(mina.say('utility.paste.error.missingFields'))
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
): Promise<{ embeds: any[] } | string> {
  const response = await postToBin(content, title)
  if (!response) return mina.say('utility.paste.error.failed')

  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('utility.paste.title') })
    .setDescription(
      mina.sayf('utility.paste.description', {
        normal: response.url,
        raw: response.raw,
      })
    )

  return { embeds: [embed] }
}

export default command
