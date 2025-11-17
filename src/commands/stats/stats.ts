import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { getMemberStats } from '@schemas/MemberStats'
import { EMBED_COLORS, STATS } from '@src/config'
import { stripIndent } from 'common-tags'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'stats',
  description: 'displays members stats in this server',
  category: 'UTILITY',
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

    const member =
      (interaction.options.getMember('user') as GuildMember) ||
      (interaction.member as GuildMember)

    if (!member) {
      return interaction.followUp('Could not find member information.')
    }

    const settings = data?.settings || {}
    const response = await stats(member, settings)
    await interaction.followUp(response)
  },
}

async function stats(member: GuildMember, settings: any) {
  if (!settings.stats?.enabled)
    return 'Stats Tracking is disabled on this server'

  const memberStats = await getMemberStats(member.guild.id, member.id)

  if (!memberStats) {
    return `${member.user.username} has no stats yet!`
  }

  const embed = new EmbedBuilder()
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addFields(
      {
        name: 'Username',
        value: member.user.username,
        inline: true,
      },
      {
        name: 'ID',
        value: member.id,
        inline: true,
      },
      {
        name: '⌚ Member since',
        value: member.joinedAt.toLocaleString(),
        inline: false,
      },
      {
        name: '💬 Messages sent',
        value: stripIndent`
      ❯ Messages Sent: ${memberStats.messages || 0}
      ❯ Slash Commands: ${memberStats.commands?.slash || 0}
      ❯ XP Earned: ${memberStats.xp || 0}
      ❯ Current Level: ${memberStats.level || 1}
    `,
        inline: false,
      },
      {
        name: '🎙️ Voice Stats',
        value: stripIndent`
      ❯ Total Connections: ${memberStats.voice?.connections || 0}
      ❯ Time Spent: ${Math.floor((memberStats.voice?.time || 0) / 60)} min
    `,
      }
    )
    .setFooter({ text: 'Stats Generated' })
    .setTimestamp()

  return { embeds: [embed] }
}

export default command
