import {
  escapeInlineCode,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
  User,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { getInvitesLb } from '@schemas/Member'
import { getXpLb } from '@schemas/MemberStats'
import { getReputationLb } from '@schemas/User'

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
    return mina.say('infoCmd.leaderboard.xp.disabled')
  }

  const lb = await getXpLb(guild.id, 10)
  if (lb.length === 0) return mina.say('infoCmd.leaderboard.xp.empty')

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id)
      collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)}\n`
    } catch (_ex) {
      // Ignore
    }
  }

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.leaderboard.xp.title') })
    .setDescription(collector)

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
    return mina.say('infoCmd.leaderboard.invite.disabled')
  }

  const lb = await getInvitesLb(guild.id, 10)
  if (lb.length === 0) return mina.say('infoCmd.leaderboard.invite.empty')

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const memberId = lb[i].member_id
      if (memberId === 'VANITY') {
        collector += `**#${(i + 1).toString()}** - vanity url [${lb[i].invites}]\n`
      } else {
        const user = await author.client.users.fetch(lb[i].member_id)
        collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)} [${lb[i].invites}]\n`
      }
    } catch (_ex) {
      collector += `**#${(i + 1).toString()}** - deleted user [${lb[i].invites}]\n`
    }
  }

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.leaderboard.invite.title') })
    .setDescription(collector)

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
  if (lb.length === 0) return mina.say('infoCmd.leaderboard.rep.empty')

  let collector = ''
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id)
      collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)} [${lb[i].rep}]\n`
    } catch (_ex) {
      collector += `**#${(i + 1).toString()}** - deleted user [${lb[i].rep}]\n`
    }
  }

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.leaderboard.rep.title') })
    .setDescription(collector)

  // Store the result in the cache for future requests
  cache.set(cacheKey, { embeds: [embed] })
  return { embeds: [embed] }
}

const command: CommandData = {
  name: 'leaderboard',
  description: 'display the xp, invite, and rep leaderboard',
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
      return interaction.followUp(mina.say('infoCmd.leaderboard.invalid'))
    }

    if (!interaction.guild) {
      return interaction.followUp(mina.say('serverOnly'))
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
        response = mina.say('infoCmd.leaderboard.invalid')
    }
    await interaction.followUp(response)
    return
  },
}

export default command
