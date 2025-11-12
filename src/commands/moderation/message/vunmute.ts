import { vUnmuteTarget } from '@helpers/ModUtils'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null
): Promise<string> => {
  const { member } = interaction
  const response = await vUnmuteTarget(member as GuildMember, target, reason)
  if (typeof response === 'boolean') {
    return `${target.user.username}'s voice is unmuted in this server`
  }
  if (response === 'MEMBER_PERM') {
    return `You do not have permission to voice unmute ${target.user.username}`
  }
  if (response === 'BOT_PERM') {
    return `I do not have permission to voice unmute ${target.user.username}`
  }
  if (response === 'NO_VOICE') {
    return `${target.user.username} is not in any voice channel`
  }
  if (response === 'NOT_MUTED') {
    return `${target.user.username} is not voice muted`
  }
  return `Failed to voice unmute ${target.user.username}`
}
