import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { MESSAGES } from '@src/config'
import { getJson } from '@helpers/HttpUtils'
import axios from 'axios'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { Logger } from '@helpers/Logger'

const BASE_URL = 'https://some-random-api.com/animal'

// Choices for each category
const ANIMAL_CHOICES = [
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

const ANIME_CHOICES = ['waifu', 'shinobu', 'megumin']

// Amina's excited responses for different image types
const AMINA_RESPONSES: Record<string, string[]> = {
  // Animal responses
  cat: [
    'OMG LOOK AT THIS ADORABLE KITTY! 🐱✨',
    'Nyaa~! Found you a super cute cat!',
    'GASP! This cat is just too precious!',
  ],
  dog: [
    "PUPPY ALERT! My heart can't handle this! 🐶",
    'Look at this good boy/girl! I just wanna squish!',
    "WHO'S A GOOD DOG? THIS DOG IS!",
  ],
  panda: [
    "A PANDA! They're like nature's comedians! 🐼",
    'Look at this chunky bundle of joy!',
    'Found you the most adorable panda ever!',
  ],
  bird: [
    'EVERYBODY KNOWS THAT THE BIRD IS THE WORD! 🐦✨',
    "B-b-b-bird bird bird, b-bird's the word! 🎵",
    'Look what flew in! AND YES, THE BIRD IS STILL THE WORD! 🐦',
  ],
  fox: [
    'FOXY FRIEND ALERT! 🦊✨',
    'What does the fox say? CUTENESS!',
    'Look at this fantastic fox!',
  ],
  red_panda: [
    'Red pandas are just living plushies, change my mind! 🐼❤️',
    'THE CUTEST RED FLOOF!',
    'Found you a red panda to brighten your day!',
  ],
  koala: [
    'EUCALYPTUS ENTHUSIAST SPOTTED! 🐨',
    'The sleepiest and cutest tree hugger!',
    'Look at this adorable koala!',
  ],
  raccoon: [
    'TRASH PANDA SUPREMACY! 🦝✨',
    'Found the cutest little bandit!',
    'Look at this adorable chaos machine!',
  ],
  kangaroo: [
    'HOP HOP HOORAY! 🦘',
    'Found you a bouncy friend!',
    'Look at this amazing jumpy boi!',
  ],

  // Anime responses
  waifu: [
    '✨ CHECK OUT THIS AMAZING WAIFU! ✨',
    "Isn't she just perfect? My artistic soul is singing!",
    'Found you some top-tier waifu material!',
  ],
  shinobu: [
    'SHINOBU TIME! Get ready for awesomeness!',
    "Look who I found! Isn't she amazing?",
    'Shinobu appreciation moment! 💜',
  ],
  megumin: [
    "EXPLOSION! 💥 Here's your Megumin!",
    "The crimson demon herself! Isn't she awesome?",
    'Found the best explosion wizard!',
  ],

  // Default responses
  default: [
    "LOOK WHAT I FOUND! Isn't it amazing? ✨",
    'OMG OMG OMG! This is too perfect!',
    'My creative senses are tingling! This is awesome!',
  ],
}

const command: CommandData = {
  name: 'image',
  description: 'fetch random animal photos or anime images',
  cooldown: 1,
  category: 'FUN',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'animal',
        description: 'fetch random animal pictures',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: 'which animal to fetch',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: ANIMAL_CHOICES.map(animal => ({
              name: animal.replace('_', ' '),
              value: animal,
            })),
          },
        ],
      },
      {
        name: 'anime',
        description: 'fetch random anime images',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: 'which character type to fetch',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: ANIME_CHOICES.map(anime => ({
              name: anime,
              value: anime,
            })),
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    const type = interaction.options.getString('type')

    if (!type) {
      return interaction.followUp('Please provide a type!')
    }

    let response
    if (subcommand === 'animal') {
      response = await getAnimalImage(interaction.user, type)
    } else {
      response = await getAnimeImage(interaction.user, type)
    }

    const message = await interaction.followUp(response)

    // Add reactions for all images
    await message.react('❤️').catch(() => {})
    await message.react('✨').catch(() => {})
    return
  },
}

async function getAnimalImage(user: User, choice: string) {
  const response = await getJson(`${BASE_URL}/${choice}`)
  if (!response.success) {
    return {
      content: `${MESSAGES.API_ERROR}\n-# error: ${response.error || 'unknown'}`,
    }
  }

  const imageUrl = response.data?.image
  const embed = MinaEmbed.primary()
    .setTitle(getRandomResponse(choice))
    .setImage(imageUrl)
    .setFooter({
      text: `requested by ${user.tag} | mina's happy to help!`,
      iconURL: user.displayAvatarURL(),
    })

  return { embeds: [embed] }
}

async function getAnimeImage(user: User, type: string) {
  try {
    const response = await axios.get(`https://api.waifu.pics/sfw/${type}`)

    return {
      embeds: [
        MinaEmbed.primary()
          .setTitle(getRandomResponse(type))
          .setImage(response.data.url)
          .setFooter({
            text: `requested by ${user.tag} | mina's creative pick!`,
            iconURL: user.displayAvatarURL(),
          }),
      ],
    }
  } catch (ex: unknown) {
    const err = ex instanceof Error ? ex : new Error(String(ex))
    Logger.error(`Error fetching ${type} image`, err)
    return {
      embeds: [
        MinaEmbed.error()
          .setDescription(
            "oh no! my creative energy must've been too strong! let's try again!"
          )
          .setFooter({
            text: `requested by ${user.tag} | don't worry, we'll get it next time!`,
            iconURL: user.displayAvatarURL(),
          }),
      ],
    }
  }
}

function getRandomResponse(type: string): string {
  const responses = AMINA_RESPONSES[type] || AMINA_RESPONSES.default
  return responses[Math.floor(Math.random() * responses.length)]
}

export default command
