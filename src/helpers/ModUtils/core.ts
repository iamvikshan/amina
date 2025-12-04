import { GuildMember, User } from 'discord.js'
import type { ColorResolvable } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { addModLogToDb } from '@schemas/ModLog'
import { error } from '@helpers/Logger'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export const DEFAULT_TIMEOUT_HOURS = 24 // hours

/**
 * Check if issuer can moderate target based on role hierarchy
 */
export const memberInteract = (
  issuer: GuildMember,
  target: GuildMember
): boolean => {
  const { guild } = issuer
  if (guild.ownerId === issuer.id) return true
  if (guild.ownerId === target.id) return false
  return issuer.roles.highest.position > target.roles.highest.position
}

/**
 * Send logs to the configured channel and stores in the database
 */
export const logModeration = async (
  issuer: GuildMember,
  target: GuildMember | User | string,
  reason: string,
  type: string,
  data: any = {}
): Promise<void> => {
  if (!type) return
  const { guild } = issuer
  const settings = await getSettings(guild)

  let logChannel: any
  if (settings.logs_channel)
    logChannel = guild.channels.cache.get(settings.logs_channel)

  // Use MinaEmbed.plain() for full control, set footer manually
  const embed = MinaEmbed.plain().setFooter({
    text: `By ${issuer.displayName} • ${issuer.id}`,
    iconURL: issuer.displayAvatarURL(),
  })

  const fields: any[] = []
  const actionType = type.toUpperCase()
  const actionKeyLower = type.toLowerCase()

  // Set color based on mod action type
  const modColor = mina.modColors[actionKeyLower as keyof typeof mina.modColors]
  if (modColor) {
    embed.setColor(modColor as ColorResolvable)
  }

  switch (actionType) {
    case 'PURGE':
      embed.setAuthor({ name: `Moderation - ${type}` })
      fields.push(
        { name: 'Purge Type', value: data.purgeType, inline: true },
        { name: 'Messages', value: data.deletedCount.toString(), inline: true },
        {
          name: 'Channel',
          value: `#${data.channel.name} [${data.channel.id}]`,
          inline: false,
        }
      )
      break
  }

  if (actionType !== 'PURGE') {
    embed
      .setAuthor({ name: `Moderation - ${type}` })
      .setThumbnail(
        target instanceof GuildMember || target instanceof User
          ? target.displayAvatarURL()
          : null
      )

    if (target instanceof GuildMember) {
      fields.push({
        name: 'Member',
        value: `${target.displayName} [${target.id}]`,
        inline: false,
      })
    } else if (target instanceof User) {
      fields.push({
        name: 'User',
        value: `${target.tag} [${target.id}]`,
        inline: false,
      })
    }

    fields.push({
      name: 'Reason',
      value: reason || 'No reason provided',
      inline: false,
    })

    if (type.toUpperCase() === 'TIMEOUT' && target instanceof GuildMember) {
      fields.push({
        name: 'Expires',
        value: `<t:${Math.round((target as any).communicationDisabledUntilTimestamp / 1000)}:R>`,
        inline: true,
      })
    }
    if (type.toUpperCase() === 'MOVE') {
      fields.push({ name: 'Moved to', value: data.channel.name, inline: true })
    }
  }

  embed.setFields(fields)
  await addModLogToDb(issuer, target, reason, type.toUpperCase())
  if (logChannel) logChannel.safeSend({ embeds: [embed] })

  // Auto-add redflag for punitive mod actions
  const punitiveActions = [
    'BAN',
    'KICK',
    'SOFTBAN',
    'TIMEOUT',
    'WARN',
    'VMUTE',
    'DEAFEN',
    'DISCONNECT',
    'MOVE',
  ]

  if (punitiveActions.includes(actionType)) {
    // Skip if target is a string (PURGE case) or not a valid user
    if (target instanceof GuildMember || target instanceof User) {
      const targetUser = target instanceof GuildMember ? target.user : target

      try {
        const { addFlagFromModAction } = await import('@schemas/User')
        await addFlagFromModAction(
          targetUser.id,
          reason,
          issuer.id,
          issuer.displayName || issuer.user.tag,
          issuer.guild.id,
          issuer.guild.name,
          actionType
        )
      } catch (ex) {
        // Silently fail if flagging fails - don't break mod actions
        error('addFlagFromModAction', ex)
      }
    }
  }
}
