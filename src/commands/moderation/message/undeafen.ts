import { unDeafenTarget } from '@helpers/ModUtils'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null
): Promise<string> => {
  const { member } = interaction
  const response = await unDeafenTarget(member as GuildMember, target, reason)
  if (typeof response === 'boolean') {
    return `${target.user.username} is undeafened in this server`
  }
  if (response === 'MEMBER_PERM') {
    return `You do not have permission to undeafen ${target.user.username}`
  }
  if (response === 'BOT_PERM') {
    return `I do not have permission to undeafen ${target.user.username}`
  }
  if (response === 'NO_VOICE') {
    return `${target.user.username} is not in any voice channel`
  }
  if (response === 'NOT_DEAFENED') {
    return `${target.user.username} is not deafened`
  }
  return `Failed to undeafen ${target.user.username}`
}
