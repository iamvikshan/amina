import {
  EmbedBuilder,
  ChannelType,
  GuildChannel,
  ThreadChannel,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { stripIndent } from 'common-tags'
import channelTypes from '@helpers/channelTypes'

export default function channelInfo(channel: GuildChannel | ThreadChannel) {
  const { id, name, parent, type } = channel
  const position = 'position' in channel ? channel.position : undefined

  let desc = stripIndent`
      ❯ ID: **${id}**
      ❯ Name: **${name}**
      ❯ Type: **${channelTypes(channel.type)}**
      ❯ Category: **${parent || 'NA'}**\n
      `

  if (type === ChannelType.GuildText) {
    const textChannel = channel as any
    const { rateLimitPerUser, nsfw } = textChannel
    desc += stripIndent`
      ❯ Topic: **${textChannel.topic || 'No topic set'}**
      ❯ Position: **${position}**
      ❯ Slowmode: **${rateLimitPerUser}**
      ❯ isNSFW: **${nsfw ? '✓' : '✕'}**\n
      `
  }

  if (
    type === ChannelType.GuildPublicThread ||
    type === ChannelType.GuildPrivateThread ||
    type === ChannelType.AnnouncementThread
  ) {
    const threadChannel = channel as ThreadChannel
    const { ownerId, archived, locked } = threadChannel
    desc += stripIndent`
      ❯ Owner Id: **${ownerId || 'Unknown'}**
      ❯ Is Archived: **${archived ? '✓' : '✕'}**
      ❯ Is Locked: **${locked ? '✓' : '✕'}**\n
      `
  }

  if (
    type === ChannelType.GuildAnnouncement ||
    type === ChannelType.AnnouncementThread
  ) {
    const newsChannel = channel as any
    const { nsfw } = newsChannel
    desc += stripIndent`
      ❯ isNSFW: **${nsfw ? '✓' : '✕'}**\n
      `
  }

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    const voiceChannel = channel as any
    const { bitrate, userLimit, full } = voiceChannel
    desc += stripIndent`
      ❯ Position: **${position}**
      ❯ Bitrate: **${bitrate}**
      ❯ User Limit: **${userLimit}**
      ❯ isFull: **${full ? '✓' : '✕'}**\n
      `
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Channel Details' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)

  return { embeds: [embed] }
}
