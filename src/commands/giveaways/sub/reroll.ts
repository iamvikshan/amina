import { GuildMember } from 'discord.js'

export default async function reroll(
  member: GuildMember,
  messageId: string
): Promise<string> {
  if (!messageId) return 'You must provide a valid message id.'

  // Permissions
  if (!member.permissions.has('ManageMessages')) {
    return 'You need to have the manage messages permissions to start giveaways.'
  }

  // Search with messageId
  const giveaway = (member.client as any).giveawaysManager.giveaways.find(
    (g: any) => g.messageId === messageId && g.guildId === member.guild.id
  )

  // If no giveaway was found
  if (!giveaway) return `Unable to find a giveaway for messageId: ${messageId}`

  // Check if the giveaway is ended
  if (!giveaway.ended) return 'The giveaway is not ended yet.'

  try {
    await giveaway.reroll()
    return 'Giveaway rerolled!'
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway Reroll', error)
    return `An error occurred while rerolling the giveaway: ${error.message}`
  }
}
