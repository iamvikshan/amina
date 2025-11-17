import { GuildMember } from 'discord.js'

export default async function edit(
  member: GuildMember,
  messageId: string,
  addDuration: number | null,
  newPrize: string | null,
  newWinnerCount: number | null
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

  try {
    await (member.client as any).giveawaysManager.edit(messageId, {
      addTime: addDuration || 0,
      newPrize: newPrize || giveaway.prize,
      newWinnerCount: newWinnerCount || giveaway.winnerCount,
    })

    return `Successfully updated the giveaway!`
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway Edit', error)
    return `An error occurred while updating the giveaway: ${error.message}`
  }
}
