import { GuildMember, EmbedBuilder } from 'discord.js'
import { GIVEAWAYS } from '@src/config'

export default async function list(
  member: GuildMember
): Promise<string | { embeds: EmbedBuilder[] }> {
  // Permissions
  if (!member.permissions.has('ManageMessages')) {
    return 'You need to have the manage messages permissions to manage giveaways.'
  }

  // Search with all giveaways
  const giveaways = (member.client as any).giveawaysManager.giveaways.filter(
    (g: any) => g.guildId === member.guild.id && g.ended === false
  )

  // No giveaways
  if (giveaways.length === 0) {
    return 'There are no giveaways running in this server.'
  }

  const description = giveaways
    .map((g: any, i: number) => `${i + 1}. ${g.prize} in <#${g.channelId}>`)
    .join('\n')

  try {
    return {
      embeds: [
        new EmbedBuilder()
          .setDescription(description)
          .setColor(GIVEAWAYS.START_EMBED), // FIX: Changed from EMBED_COLORS.GIVEAWAYS (doesn't exist)
      ],
    }
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway List', error)
    return `An error occurred while listing the giveaways: ${error.message}`
  }
}
