import {
  GuildMember,
  User,
  BaseGuildTextChannel,
  VoiceChannel,
  StageChannel,
} from 'discord.js'
import { DEFAULT_TIMEOUT_HOURS } from './core'
import { purgeMessages } from './purge'
import { warnTarget } from './warnings'
import { timeoutTarget, unTimeoutTarget } from './timeout'
import { kickTarget, softbanTarget, banTarget, unBanTarget } from './kick-ban'
import {
  vMuteTarget,
  vUnmuteTarget,
  deafenTarget,
  unDeafenTarget,
  disconnectTarget,
  moveTarget,
} from './voice'

// Export all functions for direct use
export * from './core'
export * from './purge'
export * from './warnings'
export * from './timeout'
export * from './kick-ban'
export * from './voice'

/**
 * Add a moderation action based on the action type
 */
export async function addModAction(
  issuer: GuildMember,
  target: GuildMember,
  reason: string,
  action: 'TIMEOUT' | 'KICK' | 'SOFTBAN' | 'BAN'
): Promise<string | boolean> {
  switch (action) {
    case 'TIMEOUT':
      return timeoutTarget(
        issuer,
        target,
        DEFAULT_TIMEOUT_HOURS * 60 * 60 * 1000,
        reason
      )

    case 'KICK':
      return kickTarget(issuer, target, reason)

    case 'SOFTBAN':
      return softbanTarget(issuer, target, reason)

    case 'BAN':
      return banTarget(issuer, target.user, reason)
  }
}

/**
 * ModUtils class - maintains backward compatibility with existing code
 * This class wraps all the moderation utility functions
 */
export default class ModUtils {
  /**
   * Check if issuer can moderate target
   */
  static canModerate(issuer: GuildMember, target: GuildMember): boolean {
    const { guild } = issuer
    if (guild.ownerId === issuer.id) return true
    if (guild.ownerId === target.id) return false
    return issuer.roles.highest.position > target.roles.highest.position
  }

  /**
   * Add a moderation action
   */
  static async addModAction(
    issuer: GuildMember,
    target: GuildMember,
    reason: string,
    action: 'TIMEOUT' | 'KICK' | 'SOFTBAN' | 'BAN'
  ): Promise<string | boolean> {
    return addModAction(issuer, target, reason, action)
  }

  /**
   * Delete messages based on type
   */
  static async purgeMessages(
    issuer: GuildMember,
    channel: BaseGuildTextChannel,
    type: 'ATTACHMENT' | 'BOT' | 'LINK' | 'TOKEN' | 'USER' | 'ALL',
    amount: number,
    argument?: any
  ): Promise<string | number> {
    return purgeMessages(issuer, channel, type, amount, argument)
  }

  /**
   * Warn a target member
   */
  static async warnTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return warnTarget(issuer, target, reason)
  }

  /**
   * Timeout a target member
   */
  static async timeoutTarget(
    issuer: GuildMember,
    target: GuildMember,
    ms: number,
    reason: string
  ): Promise<string | boolean> {
    return timeoutTarget(issuer, target, ms, reason)
  }

  /**
   * Remove timeout from target member
   */
  static async unTimeoutTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return unTimeoutTarget(issuer, target, reason)
  }

  /**
   * Kick a target member
   */
  static async kickTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return kickTarget(issuer, target, reason)
  }

  /**
   * Softban a target member
   */
  static async softbanTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return softbanTarget(issuer, target, reason)
  }

  /**
   * Ban a target user
   */
  static async banTarget(
    issuer: GuildMember,
    target: User,
    reason: string
  ): Promise<string | boolean> {
    return banTarget(issuer, target, reason)
  }

  /**
   * Unban a target user
   */
  static async unBanTarget(
    issuer: GuildMember,
    target: User,
    reason: string
  ): Promise<string | boolean> {
    return unBanTarget(issuer, target, reason)
  }

  /**
   * Voice mute a target member
   */
  static async vMuteTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return vMuteTarget(issuer, target, reason)
  }

  /**
   * Voice unmute a target member
   */
  static async vUnmuteTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return vUnmuteTarget(issuer, target, reason)
  }

  /**
   * Deafen a target member
   */
  static async deafenTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return deafenTarget(issuer, target, reason)
  }

  /**
   * Undeafen a target member
   */
  static async unDeafenTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return unDeafenTarget(issuer, target, reason)
  }

  /**
   * Disconnect a target member from voice
   */
  static async disconnectTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<string | boolean> {
    return disconnectTarget(issuer, target, reason)
  }

  /**
   * Move a target member to another voice channel
   */
  static async moveTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string,
    channel: VoiceChannel | StageChannel
  ): Promise<string | boolean> {
    return moveTarget(issuer, target, reason, channel)
  }
}

// Also export the class as a named export for flexibility
export { ModUtils }
