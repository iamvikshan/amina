import { ChannelType, GuildVerificationLevel, Guild } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(relativeTime)
dayjs.extend(advancedFormat)

export default async function guildInfo(guild: Guild) {
  const { name, id, preferredLocale, channels, roles, ownerId } = guild

  let owner
  try {
    owner = await guild.members.fetch(ownerId)
  } catch (_ex) {
    owner = null
  }

  const createdAt = dayjs(guild.createdAt)

  const totalChannels = channels.cache.size
  const categories = channels.cache.filter(
    c => c.type === ChannelType.GuildCategory
  ).size
  const textChannels = channels.cache.filter(
    c => c.type === ChannelType.GuildText
  ).size
  const voiceChannels = channels.cache.filter(
    c =>
      c.type === ChannelType.GuildVoice ||
      c.type === ChannelType.GuildStageVoice
  ).size
  const threadChannels = channels.cache.filter(
    c =>
      c.type === ChannelType.PrivateThread ||
      c.type === ChannelType.PublicThread
  ).size

  const memberCache = guild.members.cache
  const all = memberCache.size
  const bots = memberCache.filter(m => m.user.bot).size
  const users = all - bots
  const onlineUsers = memberCache.filter(
    m => !m.user.bot && m.presence?.status === 'online'
  ).size
  const onlineBots = memberCache.filter(
    m => m.user.bot && m.presence?.status === 'online'
  ).size
  const onlineAll = onlineUsers + onlineBots
  const rolesCount = roles.cache.size

  const getMembersInRole = (members: any, role: any) => {
    return members.filter((m: any) => m.roles.cache.has(role.id)).size
  }

  let rolesString = roles.cache
    .filter(r => !r.name.includes('everyone'))
    .map(r => `${r.name}[${getMembersInRole(memberCache, r)}]`)
    .join(', ')

  if (rolesString.length > 1024)
    rolesString = rolesString.substring(0, 1020) + '...'

  let verificationLevel: string | GuildVerificationLevel =
    guild.verificationLevel
  switch (guild.verificationLevel) {
    case GuildVerificationLevel.VeryHigh:
      verificationLevel = '┻━┻ミヽ(ಠ益ಠ)ノ彡┻━┻'
      break

    case GuildVerificationLevel.High:
      verificationLevel = '(╯°□°）╯︵ ┻━┻'
      break

    default:
      break
  }

  let desc = `> id: **${id}**\n`
  desc += `> name: **${name}**\n`
  desc += `> owner: **${owner ? owner.user.username : 'unknown'}**\n`
  desc += `> region: **${preferredLocale}**\n`

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.guild.title') })
    .setThumbnail(guild.iconURL())
    .setDescription(desc)
    .addFields(
      {
        name: mina.sayf('infoCmd.guild.fields.members', {
          count: all.toString(),
        }),
        value: `\`\`\`members: ${users}\nbots: ${bots}\`\`\``,
        inline: true,
      },
      {
        name: mina.sayf('infoCmd.guild.fields.online', {
          count: onlineAll.toString(),
        }),
        value: `\`\`\`members: ${onlineUsers}\nbots: ${onlineBots}\`\`\``,
        inline: true,
      },
      {
        name: mina.sayf('infoCmd.guild.fields.channels', {
          count: totalChannels.toString(),
        }),
        value: `\`\`\`categories: ${categories} | text: ${textChannels} | voice: ${voiceChannels} | thread: ${threadChannels}\`\`\``,
        inline: false,
      },
      {
        name: mina.sayf('infoCmd.guild.fields.roles', {
          count: rolesCount.toString(),
        }),
        value: `\`\`\`${rolesString}\`\`\``,
        inline: false,
      },
      {
        name: mina.say('infoCmd.guild.fields.verification'),
        value: `\`\`\`${verificationLevel}\`\`\``,
        inline: true,
      },
      {
        name: mina.say('infoCmd.guild.fields.boosts'),
        value: `\`\`\`${guild.premiumSubscriptionCount}\`\`\``,
        inline: true,
      },
      {
        name: mina.sayf('infoCmd.guild.fields.created', {
          time: createdAt.fromNow(),
        }),
        value: `\`\`\`${createdAt.format('dddd, Do MMMM YYYY')}\`\`\``,
        inline: false,
      }
    )

  if (guild.splashURL())
    embed.setImage(guild.splashURL({ extension: 'png', size: 256 }))

  return { embeds: [embed] }
}
