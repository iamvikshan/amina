import {
  EmbedBuilder,
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { getBuffer } from '@helpers/HttpUtils'
import { EMBED_COLORS, IMAGE } from '@src/config'
import type { Command } from '@structures/Command'

const filterDescriptions: Record<string, string> = {
  blur: "Let's add some dreamy mystique! ✨",
  brighten: 'Time to make this shine\nlike my mood! ☀️',
  burn: 'Adding some intense dramatic flair! 🔥',
  darken: 'Making it moody and mysterious~ 🌙',
  distort: 'Time for some crazy abstract vibes! 🎨',
  greyscale: 'Going classic black and white! 🖤',
  invert: 'Flipping the world upside down! 🙃',
  pixelate: 'Making it retro-cool! 👾',
  sepia: 'Adding some vintage magic! 📷',
  sharpen: 'Making every detail pop! 💫',
  threshold: 'Going totally experimental! 🎯',
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
  '*bouncing with artistic energy*\nTime to transform this image! ',
  "*pulls out virtual paintbrush*\nLet's create something amazing! ",
  '*spins excitedly*\nReady for some artistic magic? ',
  "*eyes sparkling*\nOoh, let's make this extra special! ",
  '*giggling with creative inspiration*\nWatch this transformation! ',
]

const command: Command = {
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
        Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
      },
    })

    if (!response.success) {
      return interaction.followUp(
        "*drops paintbrush sadly* Oh no! My artistic powers aren't working right now! Maybe we can try again in a bit? 🎨💔"
      )
    }

    const randomIntro =
      creativeIntros[Math.floor(Math.random() * creativeIntros.length)]
    const filterDesc =
      filterDescriptions[filter] || "Let's make some art magic! ✨"

    const attachment = new AttachmentBuilder(response.buffer, {
      name: 'attachment.png',
    })
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setTitle(`${randomIntro}${filterDesc}`)
      .setImage('attachment://attachment.png')
      .setFooter({
        text: `Art piece inspired by ${author.username}'s request! 🎨✨`,
      })

    await interaction.followUp({ embeds: [embed], files: [attachment] })
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
