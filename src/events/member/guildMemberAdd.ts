import { inviteHandler, greetingHandler } from '@src/handlers'
import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import type { GuildMember } from 'discord.js'

/**
 * Handles guild member add event
 * @param {BotClient} client - The bot client instance
 * @param {GuildMember} member - The member who joined
 */
export default async (
  client: BotClient,
  member: GuildMember
): Promise<void> => {
  if (!member || !member.guild) return

  const { guild } = member
  const settings = await getSettings(guild)

  // Autorole
  if (settings.autorole) {
    const role = guild.roles.cache.get(settings.autorole)
    if (role) member.roles.add(role).catch(_err => {})
  }

  // Check for counter channel
  if (
    settings.counters.find((doc: any) =>
      ['MEMBERS', 'BOTS', 'USERS'].includes(doc.counter_type.toUpperCase())
    )
  ) {
    if (member.user.bot) {
      settings.server.bots += 1
      await settings.save()
    }
    if (!client.counterUpdateQueue.includes(guild.id))
      client.counterUpdateQueue.push(guild.id)
  }

  // Check if invite tracking is enabled
  const inviterData = settings.invite.tracking
    ? await inviteHandler.trackJoinedMember(member)
    : {}

  // Send welcome message
  greetingHandler.sendWelcome(member, inviterData)
}
