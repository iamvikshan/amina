import { GuildMember, User, EmbedBuilder } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { addModLogToDb } from '@schemas/ModLog'
import { error } from '@helpers/Logger'
import { mina } from '@helpers/mina'

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

  const embed = new EmbedBuilder().setFooter({
    text: `By ${issuer.displayName} • ${issuer.id}`,
    iconURL: issuer.displayAvatarURL(),
  })

  const fields: any[] = []
  switch (type.toUpperCase()) {
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

    case 'TIMEOUT':
      embed.setColor(mina.modColors.timeout)
      break

    case 'UNTIMEOUT':
      embed.setColor(mina.modColors.untimeout)
      break

    case 'KICK':
      embed.setColor(mina.modColors.kick)
      break

    case 'SOFTBAN':
      embed.setColor(mina.modColors.softban)
      break

    case 'BAN':
      embed.setColor(mina.modColors.ban)
      break

    case 'UNBAN':
      embed.setColor(mina.modColors.unban)
      break

    case 'VMUTE':
      embed.setColor(mina.modColors.vmute)
      break

    case 'VUNMUTE':
      embed.setColor(mina.modColors.vunmute)
      break

    case 'DEAFEN':
      embed.setColor(mina.modColors.deafen)
      break

    case 'UNDEAFEN':
      embed.setColor(mina.modColors.undeafen)
      break

    case 'DISCONNECT':
      embed.setColor(mina.modColors.disconnect)
      break

    case 'MOVE':
      embed.setColor(mina.modColors.move)
      break
  }

  if (type.toUpperCase() !== 'PURGE') {
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
  const actionType = type.toUpperCase()

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
