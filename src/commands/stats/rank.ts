import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { IMAGE, STATS, secret } from '@src/config'
import { getBuffer } from '@helpers/HttpUtils'
import { getMemberStats, getXpLb } from '@schemas/MemberStats'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'rank',
  description: "display your or another member's xp rank card",
  cooldown: 5,
  category: 'UTILITY',
  botPermissions: ['AttachFiles'],

  slashCommand: {
    enabled: STATS.ENABLED,
    options: [
      {
        name: 'user',
        description: 'target user',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    if (!interaction.guild) {
      return interaction.followUp('This command can only be used in a server.')
    }

    const user = interaction.options.getUser('user') || interaction.user
    let member: GuildMember
    try {
      member = await interaction.guild.members.fetch(user.id)
    } catch (_ex) {
      return interaction.followUp(
        'Failed to fetch member information. The user might not be in this server.'
      )
    }

    const settings = data?.settings || {}
    const response = await getRank(interaction.guild, member, settings)
    return interaction.followUp(response)
  },
}

async function getRank(guild: any, member: GuildMember, settings: any) {
  const { user } = member
  if (!settings.stats?.enabled) return mina.say('statsCmd.disabled')

  const memberStats = await getMemberStats(guild.id, user.id)
  if (!memberStats || !memberStats.xp)
    return mina.sayf('statsCmd.notRanked', { user: user.username })

  const lb = await getXpLb(guild.id, 100)
  let pos = -1
  lb.forEach((doc, i) => {
    if (doc.member_id === user.id) {
      pos = i + 1
    }
  })

  const xpNeeded = memberStats.level * memberStats.level * 100
  const rank = pos !== -1 ? pos : 0

  const url = new URL(`${IMAGE.BASE_API}/utils/rank-card`)
  url.searchParams.append('name', user.username)
  if (user.discriminator !== '0')
    url.searchParams.append('discriminator', user.discriminator)
  url.searchParams.append(
    'avatar',
    user.displayAvatarURL({ extension: 'png', size: 128 })
  )
  url.searchParams.append('currentxp', memberStats.xp.toString())
  url.searchParams.append('reqxp', xpNeeded.toString())
  url.searchParams.append('level', memberStats.level.toString())
  url.searchParams.append('barcolor', mina.color.primary.toString())
  url.searchParams.append(
    'status',
    member?.presence?.status?.toString() || 'idle'
  )
  url.searchParams.append('rank', rank.toString())

  const response = await getBuffer(url.href, {
    headers: {
      Authorization: `Bearer ${secret.STRANGE_API_KEY || ''}`,
    },
  })
  if (!response.success || !response.buffer)
    return mina.say('statsCmd.rankFailed')

  const attachment = new AttachmentBuilder(response.buffer, {
    name: 'rank.png',
  })
  return { files: [attachment] }
}

export default command
