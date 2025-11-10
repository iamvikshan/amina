import { GuildMember } from 'discord.js'
import { error } from '@helpers/Logger'
import { getSettings } from '@schemas/Guild'
import { getMember } from '@schemas/Member'
import { memberInteract, logModeration } from './core'

/**
 * Warns the target and logs to the database, channel
 */
export async function warnTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  try {
    logModeration(issuer, target, reason, 'Warn')
    const memberDb: any = await getMember(issuer.guild.id, target.id)
    memberDb.warnings += 1
    const settings = await getSettings(issuer.guild)

    // check if max warnings are reached
    if (memberDb.warnings >= settings.max_warn.limit) {
      // Import dynamically to avoid circular dependency
      const { addModAction } = await import('./index')
      await addModAction(
        issuer.guild.members.me as GuildMember,
        target,
        'Max warnings reached',
        settings.max_warn.action
      )
      memberDb.warnings = 0 // reset warnings
    }

    await memberDb.save()
    return true
  } catch (ex) {
    error('warnTarget', ex)
    return 'ERROR'
  }
}
