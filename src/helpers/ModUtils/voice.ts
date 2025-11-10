import { GuildMember, VoiceChannel, StageChannel } from 'discord.js'
import { error } from '@helpers/Logger'
import { memberInteract, logModeration } from './core'

/**
 * Voice mutes the target and logs to the database, channel
 */
export async function vMuteTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice.channel) return 'NO_VOICE'
  if (target.voice.mute) return 'ALREADY_MUTED'

  try {
    await target.voice.setMute(true, reason)
    logModeration(issuer, target, reason, 'Vmute')
    return true
  } catch (ex) {
    error(`vMuteTarget`, ex)
    return 'ERROR'
  }
}

/**
 * Voice unmutes the target and logs to the database, channel
 */
export async function vUnmuteTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice.channel) return 'NO_VOICE'
  if (!target.voice.mute) return 'NOT_MUTED'

  try {
    await target.voice.setMute(false, reason)
    logModeration(issuer, target, reason, 'Vunmute')
    return true
  } catch (ex) {
    error(`vUnmuteTarget`, ex)
    return 'ERROR'
  }
}

/**
 * Deafens the target and logs to the database, channel
 */
export async function deafenTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice.channel) return 'NO_VOICE'
  if (target.voice.deaf) return 'ALREADY_DEAFENED'

  try {
    await target.voice.setDeaf(true, reason)
    logModeration(issuer, target, reason, 'Deafen')
    return true
  } catch (ex) {
    error(`deafenTarget`, ex)
    return `Failed to deafen ${target.user.tag}`
  }
}

/**
 * UnDeafens the target and logs to the database, channel
 */
export async function unDeafenTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice.channel) return 'NO_VOICE'
  if (!target.voice.deaf) return 'NOT_DEAFENED'

  try {
    await target.voice.setDeaf(false, reason)
    logModeration(issuer, target, reason, 'unDeafen')
    return true
  } catch (ex) {
    error(`unDeafenTarget`, ex)
    return 'ERROR'
  }
}

/**
 * Disconnects the target from voice channel and logs to the database, channel
 */
export async function disconnectTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice.channel) return 'NO_VOICE'

  try {
    await target.voice.disconnect(reason)
    logModeration(issuer, target, reason, 'Disconnect')
    return true
  } catch (ex) {
    error(`disconnectTarget`, ex)
    return 'ERROR'
  }
}

/**
 * Moves the target to another voice channel and logs to the database, channel
 */
export async function moveTarget(
  issuer: GuildMember,
  target: GuildMember,
  reason: string,
  channel: VoiceChannel | StageChannel
): Promise<string | boolean> {
  if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
  if (!memberInteract(issuer.guild.members.me as GuildMember, target))
    return 'BOT_PERM'

  if (!target.voice?.channel) return 'NO_VOICE'
  if (target.voice.channelId === channel.id) return 'ALREADY_IN_CHANNEL'

  if (!channel.permissionsFor(target)?.has(['ViewChannel', 'Connect']))
    return 'TARGET_PERM'

  try {
    await target.voice.setChannel(channel, reason)
    logModeration(issuer, target, reason, 'Move', { channel })
    return true
  } catch (ex) {
    error(`moveTarget`, ex)
    return 'ERROR'
  }
}
