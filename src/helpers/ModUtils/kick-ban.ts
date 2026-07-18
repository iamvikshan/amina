import { GuildMember, User } from 'discord.js'
import { error } from '@helpers/Logger'
import { memberInteract, logModeration } from './core'

/**
 * Kicks the target and logs to the database, channel
 * @param {GuildMember} issuer - The issuer
 * @param {GuildMember} target - The target
 * @param {string} reason - The reason
 * @returns {Promise<string | boolean>} A promise that resolves when done.
 */
export async function kickTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string,
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  try {
    await target.kick(reason)
    logModeration(issuer, target, reason, 'Kick').catch(() => {})
    return true
  } catch (ex) {
    error('kickTarget', ex)
    return 'ERROR'
  }
}

/**
 * Softbans the target and logs to the database, channel
 * @param {GuildMember} issuer - The issuer
 * @param {GuildMember} target - The target
 * @param {string} reason - The reason
 * @returns {Promise<string | boolean>} A promise that resolves when done.
 */
export async function softbanTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string,
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  try {
    await target.ban({ deleteMessageDays: 7, reason })
    await issuer.guild.members.unban(target.user)
    logModeration(issuer, target, reason, 'Softban').catch(() => {})
    return true
  } catch (ex) {
    error('softbanTarget', ex)
    return 'ERROR'
  }
}

/**
 * Bans the target and logs to the database, channel
 * @param {GuildMember} issuer - The issuer
 * @param {User} target - The target
 * @param {string} reason - The reason
 * @returns {Promise<string | boolean>} A promise that resolves when done.
 */
export async function banTarget(
  issuer: GuildMember,
  target: User,
  reason: string,
): Promise<string | boolean> {
  const targetMem = await issuer.guild.members.fetch(target.id).catch(() => {})

  if (targetMem && !memberInteract(issuer, targetMem)) return 'MEMBER_PERM'
  if (
    targetMem &&
    !memberInteract(issuer.guild.members.me as GuildMember, targetMem)
  )
    return 'BOT_PERM'

  try {
    await issuer.guild.bans.create(target.id, { deleteMessageDays: 0, reason })
    logModeration(issuer, target, reason, 'Ban').catch(() => {})
    return true
  } catch (ex) {
    error(`banTarget`, ex)
    return 'ERROR'
  }
}

/**
 * Unbans the target and logs to the database, channel
 * @param {GuildMember} issuer - The issuer
 * @param {User} target - The target
 * @param {string} reason - The reason
 * @returns {Promise<string | boolean>} A promise that resolves when done.
 */
export async function unBanTarget(
  issuer: GuildMember,
  target: User,
  reason: string,
): Promise<string | boolean> {
  try {
    await issuer.guild.bans.remove(target, reason)
    logModeration(issuer, target, reason, 'UnBan').catch(() => {})
    return true
  } catch (ex) {
    error(`unBanTarget`, ex)
    return 'ERROR'
  }
}
