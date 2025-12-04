import { getUser } from '@schemas/User'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

import axios from 'axios'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'

const choices = [
  'bite',
  'blush',
  'cringe',
  'cuddle',
  'kiss',
  'pat',
  'slap',
  'wink',
  'wave',
  'kill',
]

interface PronounInfo {
  pronouns: string | null
  source: 'profile' | 'pronoundb' | null
}

interface PronounForms {
  subject: string
  object: string
  possessive: string
}

const command: CommandData = {
  name: 'react',
  description: 'send anime-style reactions like hug, pat, slap, or kiss',
  category: 'ANIME',
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'reaction',
        description: 'type of anime reaction to send',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices.map(ch => ({ name: ch, value: ch })),
      },
      {
        name: 'target',
        description: 'user to direct the reaction at',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('reaction')
    const target = interaction.options.getUser('target')
    if (!choice) {
      return interaction.followUp('Please select a reaction!')
    }
    const embed = await genReaction(choice, interaction.user, target)
    await interaction.followUp({ embeds: [embed] })
    return
  },
}

async function getPronouns(user: User): Promise<PronounInfo> {
  try {
    // Try getting pronouns from our database first
    const userDb = await getUser(user)
    if (userDb?.profile?.pronouns && userDb?.profile?.privacy?.showPronouns) {
      return {
        pronouns: userDb.profile.pronouns,
        source: 'profile',
      }
    }

    // If not in our database, try pronoundb
    const response = await axios.get(
      `https://pronoundb.org/api/v2/lookup?platform=discord&ids=${user.id}`
    )
    if (response.data?.pronouns) {
      return {
        pronouns: response.data.pronouns,
        source: 'pronoundb',
      }
    }

    return {
      pronouns: null,
      source: null,
    }
  } catch (error) {
    console.error('Error fetching pronouns:', error)
    return {
      pronouns: null,
      source: null,
    }
  }
}

function generatePronounForms(pronounString: string | null): PronounForms {
  // Convert pronoun string (e.g. "he/him" or "they/them") to useful forms
  const [subject] = pronounString?.toLowerCase().split('/') || ['they', 'them']

  // Handle common pronoun sets
  const pronounForms: Record<string, PronounForms> = {
    // Standard pronoun mappings
    he: { subject: 'he', object: 'him', possessive: 'his' },
    she: { subject: 'she', object: 'her', possessive: 'her' },
    they: { subject: 'they', object: 'them', possessive: 'their' },
    it: { subject: 'it', object: 'it', possessive: 'its' },
    // Add any custom pronoun handling here
    xe: { subject: 'xe', object: 'xem', possessive: 'xyr' },
    ze: { subject: 'ze', object: 'zir', possessive: 'zir' },
  }

  // Use the first pronoun (subject) to get the full set of forms
  return pronounForms[subject] || pronounForms['they']
}

function generateReactionMessage(
  reaction: string,
  author: User,
  target: User | null,
  pronounInfo: PronounInfo
): string {
  if (!target) return `${author.username}'s feeling ${reaction}-y!`

  let pronounNote = ''
  if (pronounInfo.source === 'pronoundb') {
    pronounNote =
      '\n(psst! pronouns from pronoundb~ want to set your own? try `/profile setup`!)'
  } else if (!pronounInfo.pronouns) {
    pronounNote = '\n(hey! want to set your pronouns? try `/profile setup`!)'
  }

  const pronounForms = generatePronounForms(pronounInfo.pronouns)

  const messages: Record<string, string> = {
    bite: `${author.username} playfully bites ${target.username} and ${pronounForms.subject} can't help but squeak!`,
    blush: `${author.username} made ${target.username}'s face turn red~`,
    cringe: `${author.username} cringes at ${target.username}'s actions... yikes!`,
    cuddle: `${author.username} wraps ${target.username} in a warm cuddle, making ${pronounForms.possessive} day better!`,
    kiss: `${author.username} plants a sweet kiss on ${target.username}~`,
    pat: `${author.username} gently pats ${target.username}'s head, causing ${pronounForms.subject} to smile!`,
    slap: `${author.username} dramatically slaps ${target.username} anime-style!`,
    wink: `${author.username} sends a playful wink to ${target.username}~`,
    wave: `${author.username} waves enthusiastically at ${target.username}!`,
    kill: `${author.username} dramatically defeats ${target.username} in an anime battle!`,
  }

  return (
    (messages[reaction] || `${author.username} reacts ${reaction}-ily!`) +
    pronounNote
  )
}

async function genReaction(
  reaction: string,
  author: User,
  target: User | null
) {
  try {
    const [response, pronounInfo] = await Promise.all([
      axios.get(`https://api.waifu.pics/sfw/${reaction}`),
      target
        ? getPronouns(target)
        : Promise.resolve({ pronouns: null, source: null } as PronounInfo),
    ])

    const message = generateReactionMessage(
      reaction,
      author,
      target,
      pronounInfo
    )

    return MinaEmbed.primary()
      .setDescription(message)
      .setImage(response.data.url)
      .setFooter({ text: `${author.username}'s emotional moment~` })
  } catch (_ex) {
    console.error('Error fetching reaction:', _ex)
    return MinaEmbed.error()
      .setDescription('oops! the anime magic fizzled out! try again?')
      .setFooter({ text: `${author.username}'s emotional moment~` })
  }
}

export default command
