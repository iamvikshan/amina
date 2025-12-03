import { AuditLogEvent, GuildMember } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Handles member role changes event
 * @param {BotClient} client - The bot client instance
 * @param {GuildMember} oldMember - The member before role changes
 * @param {GuildMember} newMember - The member after role changes
 */
export default async (
  _client: BotClient,
  oldMember: GuildMember,
  newMember: GuildMember
): Promise<void> => {
  // Ignore if the guild is unavailable
  if (!newMember.guild.available) return

  const settings = await getSettings(newMember.guild)

  // Check if logging is enabled and a log channel is set
  if (!settings.logs.enabled || !settings.logs_channel) return

  // Check if role change logging is specifically enabled
  if (!settings.logs.member.role_changes) return

  const logChannel: any = newMember.guild.channels.cache.get(
    settings.logs_channel
  )
  if (!logChannel) return

  const oldRoles = oldMember.roles.cache
  const newRoles = newMember.roles.cache

  // Determine added and removed roles
  const addedRoles = newRoles.filter(role => !oldRoles.has(role.id))
  const removedRoles = oldRoles.filter(role => !newRoles.has(role.id))

  if (addedRoles.size === 0 && removedRoles.size === 0) return // No role changes

  // Fetch the audit log to get the user who made the change
  const auditLogs = await newMember.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberRoleUpdate,
    limit: 1,
  })

  const roleUpdateLog = auditLogs.entries.first()
  const executor = roleUpdateLog ? roleUpdateLog.executor : null

  const embed = MinaEmbed.primary()
    .setTitle('member roles updated')
    .setDescription(`roles were updated for ${newMember.user.tag}`)
    .addFields(
      {
        name: 'member',
        value: `${newMember.user.tag} (${newMember.id})`,
        inline: true,
      },
      {
        name: 'updated by',
        value: executor ? `${executor.tag} (${executor.id})` : 'unknown',
        inline: true,
      },
      {
        name: 'added roles',
        value:
          addedRoles.size > 0 ? addedRoles.map(r => r.name).join(', ') : 'none',
        inline: false,
      },
      {
        name: 'removed roles',
        value:
          removedRoles.size > 0
            ? removedRoles.map(r => r.name).join(', ')
            : 'none',
        inline: false,
      }
    )
    .setTimestamp()

  logChannel.safeSend({ embeds: [embed] })
}
