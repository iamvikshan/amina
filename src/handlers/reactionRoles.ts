import { getReactionRoles } from '@schemas/ReactionRoles'
import type { MessageReaction, User } from 'discord.js'

/**
 * Handle when a user adds a reaction to a message
 * @param reaction - The message reaction
 * @param user - The user who added the reaction
 */
export async function handleReactionAdd(
  reaction: MessageReaction,
  user: User
): Promise<void> {
  const role = await getRole(reaction)
  if (!role) return

  if (!reaction.message.guild) return
  const member = await reaction.message.guild.members.fetch(user.id)
  if (!member) return

  await member.roles.add(role).catch(() => {})
}

/**
 * Handle when a user removes a reaction from a message
 * @param reaction - The message reaction
 * @param user - The user who removed the reaction
 */
export async function handleReactionRemove(
  reaction: MessageReaction,
  user: User
): Promise<void> {
  const role = await getRole(reaction)
  if (!role) return

  if (!reaction.message.guild) return
  const member = await reaction.message.guild.members.fetch(user.id)
  if (!member) return

  await member.roles.remove(role).catch(() => {})
}

/**
 * Get the role associated with a reaction
 * @param reaction - The message reaction
 * @returns The role if found, null otherwise
 */
async function getRole(reaction: MessageReaction): Promise<any> {
  const { message, emoji } = reaction
  if (!message || !message.channel || !message.guild) return null

  const rr = getReactionRoles(
    message.guildId ?? '',
    message.channelId,
    message.id
  )
  const emote = emoji.id ? emoji.id : emoji.toString()
  const found = rr.find(doc => doc.emote === emote)

  const reactionRole = found
    ? await message.guild.roles.fetch(found.role_id)
    : null
  return reactionRole
}
