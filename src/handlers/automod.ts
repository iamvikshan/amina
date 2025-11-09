import { EmbedBuilder, Message } from 'discord.js'
import { containsLink, containsDiscordInvite } from '@helpers/Utils'
import { getMember } from '@schemas/Member'
const ModUtils = require('@helpers/ModUtils')
import { AUTOMOD } from '@src/config'
import { addAutoModLogToDb } from '@schemas/AutomodLogs'

interface AntispamInfo {
  channelId: string
  content: string
  timestamp: number
}

const antispamCache = new Map<string, AntispamInfo>()
const MESSAGE_SPAM_THRESHOLD = 3000

// Cleanup the cache
setInterval(
  () => {
    antispamCache.forEach((value, key) => {
      if (Date.now() - value.timestamp > MESSAGE_SPAM_THRESHOLD) {
        antispamCache.delete(key)
      }
    })
  },
  10 * 60 * 1000
)

/**
 * Check if the message needs to be moderated and has required permissions
 */
const shouldModerate = (message: Message): boolean => {
  const { member, guild, channel } = message

  if (!member || !guild) return false

  // Ignore if bot cannot delete channel messages
  if (!(channel as any).permissionsFor(guild.members.me)?.has('ManageMessages'))
    return false

  // Ignore Possible Guild Moderators
  if (member.permissions.has(['KickMembers', 'BanMembers', 'ManageGuild']))
    return false

  // Ignore Possible Channel Moderators
  if ((channel as any).permissionsFor(message.member)?.has('ManageMessages'))
    return false
  return true
}

/**
 * Perform moderation on the message
 */
async function performAutomod(message: Message, settings: any): Promise<void> {
  const { automod } = settings

  if (automod.wh_channels.includes(message.channelId)) return
  if (!automod.debug) return
  if (!shouldModerate(message)) return

  const { channel, member, guild, content, author, mentions } = message
  if (!member || !guild) return

  const logChannel = settings.logs_channel
    ? (channel as any).guild.channels.cache.get(settings.logs_channel)
    : null

  let shouldDelete = false
  let strikesTotal = 0

  const fields: Array<{ name: string; value: string; inline: boolean }> = []

  // Max mentions
  if (mentions.members.size > automod.max_mentions) {
    fields.push({
      name: 'Mentions',
      value: `${mentions.members.size}/${automod.max_mentions}`,
      inline: true,
    })
    // strikesTotal += mentions.members.size - automod.max_mentions;
    strikesTotal += 1
  }

  // Maxrole mentions
  if (mentions.roles.size > automod.max_role_mentions) {
    fields.push({
      name: 'RoleMentions',
      value: `${mentions.roles.size}/${automod.max_role_mentions}`,
      inline: true,
    })
    // strikesTotal += mentions.roles.size - automod.max_role_mentions;
    strikesTotal += 1
  }

  if (automod.anti_massmention > 0) {
    // check everyone mention
    if (mentions.everyone) {
      fields.push({ name: 'Everyone Mention', value: '✓', inline: true })
      strikesTotal += 1
    }

    // check user/role mentions
    if (mentions.users.size + mentions.roles.size > automod.anti_massmention) {
      fields.push({
        name: 'User/Role Mentions',
        value: `${mentions.users.size + mentions.roles.size}/${automod.anti_massmention}`,
        inline: true,
      })
      // strikesTotal += mentions.users.size + mentions.roles.size - automod.anti_massmention;
      strikesTotal += 1
    }
  }

  // Max Lines
  if (automod.max_lines > 0) {
    const count = content.split('\n').length
    if (count > automod.max_lines) {
      fields.push({
        name: 'New Lines',
        value: `${count}/${automod.max_lines}`,
        inline: true,
      })
      shouldDelete = true
      // strikesTotal += Math.ceil((count - automod.max_lines) / automod.max_lines);
      strikesTotal += 1
    }
  }

  // Anti Attachments
  if (automod.anti_attachments) {
    if (message.attachments.size > 0) {
      fields.push({ name: 'Attachments Found', value: '✓', inline: true })
      shouldDelete = true
      strikesTotal += 1
    }
  }

  // Anti links
  if (automod.anti_links) {
    if (containsLink(content)) {
      fields.push({ name: 'Links Found', value: '✓', inline: true })
      shouldDelete = true
      strikesTotal += 1
    }
  }

  // Anti Spam
  if (!automod.anti_links && automod.anti_spam) {
    if (containsLink(content)) {
      const key = author.id + '|' + message.guildId
      if (antispamCache.has(key)) {
        const antispamInfo = antispamCache.get(key)
        if (
          antispamInfo &&
          antispamInfo.channelId !== message.channelId &&
          antispamInfo.content === content &&
          Date.now() - antispamInfo.timestamp < MESSAGE_SPAM_THRESHOLD
        ) {
          fields.push({ name: 'AntiSpam Detection', value: '✓', inline: true })
          shouldDelete = true
          strikesTotal += 1
        }
      } else {
        const antispamInfo: AntispamInfo = {
          channelId: message.channelId,
          content,
          timestamp: Date.now(),
        }
        antispamCache.set(key, antispamInfo)
      }
    }
  }

  // Anti Invites
  if (!automod.anti_links && automod.anti_invites) {
    if (containsDiscordInvite(content)) {
      fields.push({ name: 'Discord Invites', value: '✓', inline: true })
      shouldDelete = true
      strikesTotal += 1
    }
  }

  // delete message if deletable
  if (shouldDelete && message.deletable) {
    message
      .delete()
      .then(() =>
        (channel as any).safeSend('> Auto-Moderation! Message deleted', 5)
      )
      .catch(() => {})
  }

  if (strikesTotal > 0) {
    // add strikes to member
    const memberDb = (await getMember(guild.id, author.id)) as any
    memberDb.strikes += strikesTotal

    // log to db
    const reason = fields
      .map(field => field.name + ': ' + field.value)
      .join('\n')
    addAutoModLogToDb(member, content, reason, strikesTotal).catch(() => {})

    // send automod log
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Auto Moderation' })
        .setThumbnail(author.displayAvatarURL())
        .setColor(AUTOMOD.LOG_EMBED as any)
        .addFields(fields)
        .setDescription(
          `**Channel:** ${channel.toString()}\n**Content:**\n${content}`
        )
        .setFooter({
          text: `By ${author.username} | ${author.id}`,
          iconURL: author.avatarURL() || undefined,
        })

      ;(logChannel as any).safeSend({ embeds: [logEmbed] })
    }

    // DM strike details
    const strikeEmbed = new EmbedBuilder()
      .setColor(AUTOMOD.DM_EMBED as any)
      .setThumbnail(guild.iconURL())
      .setAuthor({ name: 'Auto Moderation' })
      .addFields(fields)
      .setDescription(
        `You have received ${strikesTotal} strikes!\n\n` +
          `**Guild:** ${guild.name}\n` +
          `**Total Strikes:** ${memberDb.strikes} out of ${automod.strikes}`
      )

    author.send({ embeds: [strikeEmbed] }).catch(() => {})

    // check if max strikes are received
    if (memberDb.strikes >= automod.strikes) {
      // Reset Strikes
      memberDb.strikes = 0

      // Add Moderation Action
      await ModUtils.addModAction(
        guild.members.me,
        member,
        'Automod: Max strikes received',
        automod.action
      ).catch(() => {})
    }

    await memberDb.save()
  }
}

export default {
  performAutomod,
}

