import { GuildMember } from 'discord.js'

export default async function pause(
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

  // Check if the giveaway is paused
  if (giveaway.pauseOptions.isPaused) return 'This giveaway is already paused.'

  try {
    await giveaway.pause()
    return 'Success! Giveaway paused!'
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway Pause', error)
    return `An error occurred while pausing the giveaway: ${error.message}`
  }
}
