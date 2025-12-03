import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import responses from '@data/responses'
import { getJson } from '@helpers/HttpUtils'

// Amina's enthusiastic animal descriptions
const animalEmojis: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  panda: '🐼',
  fox: '🦊',
  red_panda: '🔴🐼',
  koala: '🐨',
  bird: '🐦',
  raccoon: '🦝',
  kangaroo: '🦘',
}

const animals = [
  'cat',
  'dog',
  'panda',
  'fox',
  'red_panda',
  'koala',
  'bird',
  'raccoon',
  'kangaroo',
]
const BASE_URL = 'https://some-random-api.com/animal'

const command: CommandData = {
  name: 'facts',
  description:
    "Want to discover some super amazing animal facts? I've got tons to share!",
  cooldown: 1,
  category: 'FUN',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'name',
        description: 'Pick your animal friend! (I love them all! 💖)',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: animals.map(animal => ({ name: animal, value: animal })),
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('name')
    if (!choice) {
      return interaction.followUp('Please select an animal!')
    }
    const response = await getFact(interaction.user, choice)
    await interaction.followUp(response)
    return
  },
}

async function getFact(
  user: User,
  choice: string
): Promise<{ content?: string; embeds?: MinaEmbed[] }> {
  const response = await getJson(`${BASE_URL}/${choice}`)
  if (!response.success) {
    return {
      content: mina.say('fun.facts.error'),
    }
  }

  const fact = response.data?.fact
  const imageUrl = response.data?.image
  const aminaIntros = responses.fun.facts.intros
  const randomIntro =
    aminaIntros[Math.floor(Math.random() * aminaIntros.length)]

  const embed = MinaEmbed.primary()
    .setTitle(
      mina.sayf('fun.facts.embed.title', {
        emoji: animalEmojis[choice] || '✨',
        animal: choice.toUpperCase(),
      })
    )
    .setImage(imageUrl)
    .setDescription(
      mina.sayf('fun.facts.embed.description', {
        intro: randomIntro,
        animal: choice,
        fact: fact,
      })
    )
    .setFooter({
      text: mina.sayf('fun.facts.embed.footer', { user: user.tag }),
    })

  return { embeds: [embed] }
}

export default command
