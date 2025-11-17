import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { EMBED_COLORS, IMAGE, STATS } from '@src/config'
import { getBuffer } from '@helpers/HttpUtils'
import { getMemberStats, getXpLb } from '@schemas/MemberStats'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'rank',
  description: 'displays members rank in this server',
  cooldown: 5,
  category: 'UTILITY',
  botPermissions: ['AttachFiles'],
  testGuildOnly: true,

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
    } catch (ex) {
      return interaction.followUp(
        'Failed to fetch member information. The user might not be in this server.'
      )
    }

    const settings = data?.settings || {}
    const response = await getRank(interaction.guild, member, settings)
    await interaction.followUp(response)
  },
}

async function getRank(guild: any, member: GuildMember, settings: any) {
  const { user } = member
  if (!settings.stats?.enabled)
    return 'Stats Tracking is disabled on this server'

  const memberStats = await getMemberStats(guild.id, user.id)
  if (!memberStats || !memberStats.xp)
    return `${user.username} is not ranked yet!`

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
  url.searchParams.append('barcolor', EMBED_COLORS.BOT_EMBED)
  url.searchParams.append(
    'status',
    member?.presence?.status?.toString() || 'idle'
  )
  url.searchParams.append('rank', rank.toString())

  const response = await getBuffer(url.href, {
    headers: {
      Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
    },
  })
  if (!response.success || !response.buffer)
    return 'Failed to generate rank-card'

  const attachment = new AttachmentBuilder(response.buffer, {
    name: 'rank.png',
  })
  return { files: [attachment] }
}

export default command
