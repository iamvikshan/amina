import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { getMemberStats } from '@schemas/MemberStats'
import { STATS } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'stats',
  description: 'view detailed xp and message statistics for a member',
  category: 'UTILITY',

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
      return interaction.followUp(mina.say('serverOnly'))
    }

    const member =
      (interaction.options.getMember('user') as GuildMember) ||
      (interaction.member as GuildMember)

    if (!member) {
      return interaction.followUp(mina.say('statsCmd.fetchFailed'))
    }

    const settings = data?.settings || {}
    const response = await stats(member, settings)
    return interaction.followUp(response)
  },
}

async function stats(member: GuildMember, settings: any) {
  if (!settings.stats?.enabled) return mina.say('statsCmd.disabled')

  const memberStats = await getMemberStats(member.guild.id, member.id)

  if (!memberStats) {
    return mina.sayf('statsCmd.noStats', { user: member.user.username })
  }

  const embed = MinaEmbed.info()
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      {
        name: mina.say('statsCmd.fields.username'),
        value: member.user.username,
        inline: true,
      },
      {
        name: mina.say('statsCmd.fields.id'),
        value: member.id,
        inline: true,
      },
      {
        name: mina.say('statsCmd.fields.memberSince'),
        value: member.joinedAt?.toLocaleString() || 'unknown',
        inline: false,
      },
      {
        name: mina.say('statsCmd.fields.messages'),
        value: `> messages: ${memberStats.messages || 0}\n> slash commands: ${memberStats.commands?.slash || 0}\n> xp: ${memberStats.xp || 0}\n> level: ${memberStats.level || 1}`,
        inline: false,
      },
      {
        name: mina.say('statsCmd.fields.voice'),
        value: `> connections: ${memberStats.voice?.connections || 0}\n> time: ${Math.floor((memberStats.voice?.time || 0) / 60)} min`,
      }
    )
    .setTimestamp()

  return { embeds: [embed] }
}

export default command
