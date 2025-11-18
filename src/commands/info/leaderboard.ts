import {
  EmbedBuilder,
  escapeInlineCode,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
  User,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getInvitesLb } from '@schemas/Member'
import { getXpLb } from '@schemas/MemberStats'
import { getReputationLb } from '@schemas/User'
import type { Command } from '@structures/Command'

const leaderboardTypes = ['xp', 'invite', 'rep']

// Create a Map object to store cache entries
const cache = new Map()

async function getXpLeaderboard(
  guild: Guild,
  author: User,
  settings: any = {}
): Promise<any> {
  // Create a cache key using the guild ID and the type of leaderboard
  const cacheKey = `${guild.id}:xp`

  // Check if there is a cached result for this request
  if (cache.has(cacheKey)) {
    // Return the cached result if it exists
    return cache.get(cacheKey)
  }

  // Check if settings.stats is enabled
  if (!settings.stats || !settings.stats.enabled) {
    return 'The leaderboard is disabled on this server'
  }

  const lb = await getXpLb(guild.id, 10)
  if (lb.length === 0) return 'There are no users in the leaderboard'

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id)
      collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)}\n`
    } catch (ex) {
      // Ignore
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'XP Leaderboard' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Requested by ${author.tag}` })

  // Store the result in the cache for future requests
  cache.set(cacheKey, { embeds: [embed] })
  return { embeds: [embed] }
}

async function getInviteLeaderboard(
  guild: Guild,
  author: User,
  settings: any = {}
): Promise<any> {
  // Create a cache key using the guild ID and the type of leaderboard
  const cacheKey = `${guild.id}:invite`

  // Check if there is a cached result for this request
  if (cache.has(cacheKey)) {
    // Return the cached result if it exists
    return cache.get(cacheKey)
  }

  // Check if settings.invite.tracking is enabled
  if (!settings.invite || !settings.invite.tracking) {
    return 'Invite tracking is disabled on this server'
  }

  const lb = await getInvitesLb(guild.id, 10)
  if (lb.length === 0) return 'There are no users in the leaderboard'

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const memberId = lb[i].member_id
      if (memberId === 'VANITY') {
        collector += `**#${(i + 1).toString()}** - Vanity URL [${lb[i].invites}]\n`
      } else {
        const user = await author.client.users.fetch(lb[i].member_id)
        collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)} [${lb[i].invites}]\n`
      }
    } catch (ex) {
      collector += `**#${(i + 1).toString()}** - DeletedUser#0000 [${lb[i].invites}]\n`
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Invite Leaderboard' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Requested by ${author.tag}` })

  // Store the result in the cache for future requests
  cache.set(cacheKey, { embeds: [embed] })
  return { embeds: [embed] }
}

async function getRepLeaderboard(author: User): Promise<any> {
  // Create a cache key using the user ID and the type of leaderboard
  const cacheKey = `${author.id}:rep`

  // Check if there is a cached result for this request
  if (cache.has(cacheKey)) {
    // Return the cached result if it exists
    return cache.get(cacheKey)
  }

  const lb = await getReputationLb(10)
  if (lb.length === 0) return 'There are no users in the leaderboard'

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id)
      collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)} [${lb[i].rep}]\n`
    } catch (ex) {
      collector += `**#${(i + 1).toString()}** - DeletedUser#0000 [${lb[i].rep}]\n`
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Reputation Leaderboard' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Requested by ${author.tag}` })

  // Store the result in the cache for future requests
  cache.set(cacheKey, { embeds: [embed] })
  return { embeds: [embed] }
}

const command: Command = {
  name: 'leaderboard',
  description: 'display the XP, invite, and rep leaderboard',
  category: 'INFO',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'type',
        description: 'type of leaderboard to display',
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: leaderboardTypes.map(type => ({
          name: type,
          value: type,
        })),
      },
    ],
  },
  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    const type = interaction.options.getString('type')
    if (!type) {
      return interaction.followUp('Please specify a leaderboard type.')
    }

    if (!interaction.guild) {
      return interaction.followUp('This command can only be used in a server.')
    }

    const settings = data?.settings || {}
    let response

    switch (type) {
      case 'xp':
        response = await getXpLeaderboard(
          interaction.guild,
          interaction.user,
          settings
        )
        break
      case 'invite':
        response = await getInviteLeaderboard(
          interaction.guild,
          interaction.user,
          settings
        )
        break
      case 'rep':
        response = await getRepLeaderboard(interaction.user)
        break
      default:
        response =
          'Invalid Leaderboard type. Choose either `xp`, `invite`, or `rep`'
    }
    await interaction.followUp(response)
  },
}

export default command
