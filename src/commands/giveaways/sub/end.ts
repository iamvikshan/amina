import { GuildMember } from 'discord.js'

export default async function end(
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
  if (giveaway.ended) return 'The giveaway has already ended.'

  try {
    await giveaway.end()
    return 'Success! The giveaway has ended!'
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway End', error)
    return `An error occurred while ending the giveaway: ${error.message}`
  }
}
