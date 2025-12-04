import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { getBuffer } from '@helpers/HttpUtils'
import { IMAGE, secret } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const availableOverlays = [
  'approved',
  'brazzers',
  'gay',
  'halloween',
  'rejected',
  'thuglife',
  'to-be-continued',
  'wasted',
]

const command: CommandData = {
  name: 'overlay',
  description: 'add overlays like wasted, thuglife, or jail to an image',
  category: 'IMAGE',
  botPermissions: ['EmbedLinks', 'AttachFiles'],
  cooldown: 1,
  slashCommand: {
    enabled: IMAGE.ENABLED,
    options: [
      {
        name: 'name',
        description: 'pick your flavor of artistic mayhem',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: availableOverlays.map(overlay => ({
          name: overlay,
          value: overlay,
        })),
      },
      {
        name: 'user',
        description: 'whose picture should we mess with?',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'link',
        description: 'got a specific image you want to transform?',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const author = interaction.user
    const user = interaction.options.getUser('user')
    const imageLink = interaction.options.getString('link')
    const filter = interaction.options.getString('name')
    if (!filter) return

    let image: string | undefined
    if (user) image = user.displayAvatarURL({ size: 256, extension: 'png' })
    if (!image && imageLink) image = imageLink
    if (!image) image = author.displayAvatarURL({ size: 256, extension: 'png' })

    const url = getOverlay(filter, image)
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${secret.STRANGE_API_KEY || ''}`,
      },
    })

    if (!response.success)
      return interaction.followUp(
        'oops! something went wrong with the image magic'
      )

    const buffer = response.buffer
    if (!buffer)
      return interaction.followUp(
        'oops! something went wrong with the image magic'
      )
    const attachment = new AttachmentBuilder(buffer, {
      name: 'attachment.png',
    })
    const embed = MinaEmbed.primary()
      .setImage('attachment://attachment.png')
      .setFooter({ text: `sparkled up by ${author.username}` })

    await interaction.followUp({ embeds: [embed], files: [attachment] })
    return
  },
}

function getOverlay(filter: string, image: string): string {
  const endpoint = new URL(`${IMAGE.BASE_API}/overlays/${filter}`)
  endpoint.searchParams.append('image', image)
  return endpoint.href
}

export default command
