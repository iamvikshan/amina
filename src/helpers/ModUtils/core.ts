import { GuildMember, User, EmbedBuilder } from 'discord.js'
import { MODERATION } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { addModLogToDb } from '@schemas/ModLog'

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
      embed.setColor(MODERATION.EMBED_COLORS.TIMEOUT)
      break

    case 'UNTIMEOUT':
      embed.setColor(MODERATION.EMBED_COLORS.UNTIMEOUT)
      break

    case 'KICK':
      embed.setColor(MODERATION.EMBED_COLORS.KICK)
      break

    case 'SOFTBAN':
      embed.setColor(MODERATION.EMBED_COLORS.SOFTBAN)
      break

    case 'BAN':
      embed.setColor(MODERATION.EMBED_COLORS.BAN)
      break

    case 'UNBAN':
      embed.setColor(MODERATION.EMBED_COLORS.UNBAN)
      break

    case 'VMUTE':
      embed.setColor(MODERATION.EMBED_COLORS.VMUTE)
      break

    case 'VUNMUTE':
      embed.setColor(MODERATION.EMBED_COLORS.VUNMUTE)
      break

    case 'DEAFEN':
      embed.setColor(MODERATION.EMBED_COLORS.DEAFEN)
      break

    case 'UNDEAFEN':
      embed.setColor(MODERATION.EMBED_COLORS.UNDEAFEN)
      break

    case 'DISCONNECT':
      embed.setColor(MODERATION.EMBED_COLORS.DISCONNECT)
      break

    case 'MOVE':
      embed.setColor(MODERATION.EMBED_COLORS.MOVE)
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
}
