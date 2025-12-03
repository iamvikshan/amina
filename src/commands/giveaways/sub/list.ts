import { GuildMember } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default async function list(
  member: GuildMember
): Promise<string | { embeds: any[] }> {
  // Permissions
  if (!member.permissions.has('ManageMessages')) {
    return mina.say('giveaway.list.error.noPermission')
  }

  // Search with all giveaways
  const giveaways = (member.client as any).giveawaysManager.giveaways.filter(
    (g: any) => g.guildId === member.guild.id && g.ended === false
  )

  // No giveaways
  if (giveaways.length === 0) {
    return mina.say('giveaway.list.empty')
  }

  const description = giveaways
    .map((g: any, i: number) => `${i + 1}. ${g.prize} in <#${g.channelId}>`)
    .join('\n')

  try {
    return {
      embeds: [MinaEmbed.primary().setDescription(description)],
    }
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway List', error)
    return mina.sayf('giveaway.list.error.failed', { error: error.message })
  }
}
