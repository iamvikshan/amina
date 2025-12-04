import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { getBuffer } from '@helpers/HttpUtils'
import { IMAGE, secret } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

// mina's favorite meme reactions
const memeReactions: Record<string, string> = {
  ad: 'making you famous!',
  affect: 'oops, what happened here?',
  beautiful: "now that's art!",
  bobross: 'happy little accidents~',
  challenger: 'game on!',
  confusedstonk: 'wait, what?',
  delete: 'poof!',
  dexter: 'time for science!',
  facepalm: '*giggles* oh no...',
  jail: 'busted!',
  jokeoverhead: 'whoosh~',
  karaba: 'magic time!',
  'kyon-gun': 'pew pew!',
  mms: 'sweet!',
  notstonk: 'oof, down we go!',
  poutine: 'yummy!',
  rip: 'press f to pay respects',
  shht: 'yikes!',
  stonk: 'to the moon!',
  tattoo: 'forever art!',
  thomas: 'choo choo!',
  trash: "one person's trash...",
  wanted: 'catch them!',
  worthless: '*gasp* no way!',
}

const availableGenerators = [
  'ad',
  'affect',
  'beautiful',
  'bobross',
  'challenger',
  'confusedstonk',
  'delete',
  'dexter',
  'facepalm',
  'hitler',
  'jail',
  'jokeoverhead',
  'karaba',
  'kyon-gun',
  'mms',
  'notstonk',
  'poutine',
  'rip',
  'shht',
  'stonk',
  'tattoo',
  'thomas',
  'trash',
  'wanted',
  'worthless',
]

const command: CommandData = {
  name: 'generator',
  description: 'create meme images like wanted posters, jail photos, and more',
  cooldown: 1,
  category: 'IMAGE',
  botPermissions: ['EmbedLinks', 'AttachFiles'],
  slashCommand: {
    enabled: IMAGE.ENABLED,
    options: [
      {
        name: 'name',
        description: 'which meme template to use',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: availableGenerators.map(gen => ({ name: gen, value: gen })),
      },
      {
        name: 'user',
        description: 'user whose avatar to use',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'link',
        description: 'or provide an image url instead',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const author = interaction.user
    const user = interaction.options.getUser('user')
    const imageLink = interaction.options.getString('link')
    const generator = interaction.options.getString('name')

    if (!generator) {
      return interaction.followUp('Please provide a generator name!')
    }

    let image: string | undefined
    if (user) image = user.displayAvatarURL({ size: 256, extension: 'png' })
    if (!image && imageLink) image = imageLink
    if (!image) image = author.displayAvatarURL({ size: 256, extension: 'png' })

    const url = getGenerator(generator, image)
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${secret.STRANGE_API_KEY || ''}`,
      },
    })

    if (!response.success) {
      return interaction.followUp(
        '*drops art supplies* Oops! Something went wrong with the meme magic!'
      )
    }

    if (!response.buffer) {
      return interaction.followUp(
        '*drops art supplies* Oops! The meme service did not return an image buffer!'
      )
    }

    const attachment = new AttachmentBuilder(response.buffer, {
      name: 'attachment.png',
    })
    const embed = MinaEmbed.primary()
      .setTitle(memeReactions[generator] || 'meme magic incoming!')
      .setImage('attachment://attachment.png')
      .setFooter({ text: `${author.username}'s meme creation!` })

    await interaction.followUp({ embeds: [embed], files: [attachment] })
    return
  },
}

function getGenerator(genName: string, image: string): string {
  const endpoint = new URL(`${IMAGE.BASE_API}/generators/${genName}`)
  endpoint.searchParams.append('image', image)
  return endpoint.href
}

export default command
