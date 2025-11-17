import { GuildMember } from 'discord.js'

export default async function resume(
  member: GuildMember,
  messageId: string
): Promise<string> {
  if (!messageId) return 'You must provide a valid message id.'

  // Permissions
  if (!member.permissions.has('ManageMessages')) {
    return 'You need to have the manage messages permissions to manage giveaways.'
  }

  // Search with messageId
  const giveaway = (member.client as any).giveawaysManager.giveaways.find(
    (g: any) => g.messageId === messageId && g.guildId === member.guild.id
  )

  // If no giveaway was found
  if (!giveaway) return `Unable to find a giveaway for messageId: ${messageId}`

  // Check if the giveaway is unpaused
  if (!giveaway.pauseOptions.isPaused) return 'This giveaway is not paused.'

  try {
    await giveaway.unpause()
    return 'Success! Giveaway unpaused!'
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway Resume', error)
    return `An error occurred while unpausing the giveaway: ${error.message}`
  }
}
