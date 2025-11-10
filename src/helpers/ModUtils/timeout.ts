import { GuildMember } from 'discord.js'
import { error } from '@helpers/Logger'
import { memberInteract, logModeration } from './core'

/**
 * Timeouts (aka mutes) the target and logs to the database, channel
 */
export async function timeoutTarget(
  issuer: GuildMember,
  target: GuildMember,
  ms: number,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'
  if ((target.communicationDisabledUntilTimestamp || 0) - Date.now() > 0)
    return 'ALREADY_TIMEOUT'

  try {
    await target.timeout(ms, reason)
    logModeration(issuer, target, reason, 'Timeout')
    return true
  } catch (ex) {
    error('timeoutTarget', ex)
    return 'ERROR'
  }
}

/**
 * UnTimeouts (aka unmutes) the target and logs to the database, channel
 */
export async function unTimeoutTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'
  if ((target.communicationDisabledUntilTimestamp || 0) - Date.now() < 0)
    return 'NO_TIMEOUT'

  try {
    await target.timeout(null, reason)
    logModeration(issuer, target, reason, 'UnTimeout')
    return true
  } catch (ex) {
    error('unTimeoutTarget', ex)
    return 'ERROR'
  }
}
