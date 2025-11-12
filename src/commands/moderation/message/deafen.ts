import { deafenTarget } from '@helpers/ModUtils'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null
): Promise<string> => {
  const { member } = interaction
  const response = await deafenTarget(member as GuildMember, target, reason)
  if (typeof response === 'boolean') {
    return `${target.user.username} is deafened in this server`
  }
  if (response === 'MEMBER_PERM') {
    return `You do not have permission to deafen ${target.user.username}`
  }
  if (response === 'BOT_PERM') {
    return `I do not have permission to deafen ${target.user.username}`
  }
  if (response === 'NO_VOICE') {
    return `${target.user.username} is not in any voice channel`
  }
  if (response === 'ALREADY_DEAFENED') {
    return `${target.user.username} is already deafened`
  }
  return `Failed to deafen ${target.user.username}`
}
