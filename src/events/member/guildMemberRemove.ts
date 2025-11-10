import { inviteHandler, greetingHandler } from '@src/handlers'
import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import type { GuildMember, PartialGuildMember } from 'discord.js'

/**
 * Handles guild member remove event
 * @param {BotClient} client - The bot client instance
 * @param {GuildMember | PartialGuildMember} member - The member who left
 */
export default async (
  client: BotClient,
  member: GuildMember | PartialGuildMember
): Promise<void> => {
  if (member.partial) await member.user.fetch()
  if (!member.guild) return

  const { guild } = member
  const settings = await getSettings(guild)

  // Check for counter channel
  if (
    settings.counters.find((doc: any) =>
      ['MEMBERS', 'BOTS', 'USERS'].includes(doc.counter_type.toUpperCase())
    )
  ) {
    if (member.user.bot) {
      settings.server.bots -= 1
      await settings.save()
    }
    if (!client.counterUpdateQueue.includes(guild.id))
      client.counterUpdateQueue.push(guild.id)
  }

  // Invite Tracker
  const inviterData = await inviteHandler.trackLeftMember(guild, member.user)

  // Farewell message
  greetingHandler.sendFarewell(member as GuildMember, inviterData)
}
