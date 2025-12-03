import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { getBuffer } from '@helpers/HttpUtils'
import { IMAGE, secret } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const filterDescriptions: Record<string, string> = {
  blur: "let's add some dreamy mystique!",
  brighten: 'time to make this shine\nlike my mood!',
  burn: 'adding some intense dramatic flair!',
  darken: 'making it moody and mysterious~',
  distort: 'time for some crazy abstract vibes!',
  greyscale: 'going classic black and white!',
  invert: 'flipping the world upside down!',
  pixelate: 'making it retro-cool!',
  sepia: 'adding some vintage magic!',
  sharpen: 'making every detail pop!',
  threshold: 'going totally experimental!',
}

const availableFilters = [
  'blur',
  'brighten',
  'burn',
  'darken',
  'distort',
  'greyscale',
  'invert',
  'pixelate',
  'sepia',
  'sharpen',
  'threshold',
]

const additionalParams: Record<
  string,
  { params: Array<{ name: string; value: string }> }
> = {
  brighten: {
    params: [{ name: 'amount', value: '100' }],
  },
  darken: {
    params: [{ name: 'amount', value: '100' }],
  },
  distort: {
    params: [{ name: 'level', value: '10' }],
  },
  pixelate: {
    params: [{ name: 'pixels', value: '10' }],
  },
  sharpen: {
    params: [{ name: 'level', value: '5' }],
  },
  threshold: {
    params: [{ name: 'amount', value: '100' }],
  },
}

const creativeIntros = [
  '*bouncing with artistic energy*\ntime to transform this image! ',
  "*pulls out virtual paintbrush*\nlet's create something amazing! ",
  '*spins excitedly*\nready for some artistic magic? ',
  "*eyes sparkling*\nooh, let's make this extra special! ",
  '*giggling with creative inspiration*\nwatch this transformation! ',
]

const command: CommandData = {
  name: 'filter',
  description:
    'Turn your images into amazing artwork! Time for some creative chaos!',
  category: 'IMAGE',
  botPermissions: ['EmbedLinks', 'AttachFiles'],
  cooldown: 1,
  slashCommand: {
    enabled: IMAGE.ENABLED,
    options: [
      {
        name: 'name',
        description:
          'Pick your artistic transformation! Each one is uniquely amazing!',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: availableFilters.map(filter => ({
          name: filter,
          value: filter,
        })),
      },
      {
        name: 'user',
        description: "Want to transform someone's avatar? Tag them here!",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'link',
        description: 'Got a special image to transform? Drop the link here!',
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

    if (!filter) {
      return interaction.followUp('Please provide a filter name!')
    }

    let image: string | undefined
    if (user) image = user.displayAvatarURL({ size: 256, extension: 'png' })
    if (!image && imageLink) image = imageLink
    if (!image) image = author.displayAvatarURL({ size: 256, extension: 'png' })

    const url = getFilter(filter, image)
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${secret.STRANGE_API_KEY || ''}`,
      },
    })

    if (!response.success) {
      return interaction.followUp(
        "*drops paintbrush sadly* oh no! my artistic powers aren't working right now! maybe we can try again in a bit?"
      )
    }

    const randomIntro =
      creativeIntros[Math.floor(Math.random() * creativeIntros.length)]
    const filterDesc =
      filterDescriptions[filter] || "let's make some art magic!"

    const attachment = new AttachmentBuilder(response.buffer!, {
      name: 'attachment.png',
    })
    const embed = MinaEmbed.primary()
      .setTitle(`${randomIntro}${filterDesc}`)
      .setImage('attachment://attachment.png')
      .setFooter({
        text: `art piece inspired by ${author.username}'s request!`,
      })

    await interaction.followUp({ embeds: [embed], files: [attachment] })
    return
  },
}

function getFilter(filter: string, image: string): string {
  const endpoint = new URL(`${IMAGE.BASE_API}/filters/${filter}`)
  endpoint.searchParams.append('image', image)

  // add additional params if any
  if (additionalParams[filter]) {
    additionalParams[filter].params.forEach(param => {
      endpoint.searchParams.append(param.name, param.value)
    })
  }

  return endpoint.href
}

export default command
