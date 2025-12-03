import { ChannelType, GuildChannel, ThreadChannel } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import channelTypes from '@helpers/channelTypes'

export default function channelInfo(channel: GuildChannel | ThreadChannel) {
  const { id, name, parent, type } = channel
  const position = 'position' in channel ? channel.position : undefined

  let desc = `> id: **${id}**\n`
  desc += `> name: **${name}**\n`
  desc += `> type: **${channelTypes(channel.type)}**\n`
  desc += `> category: **${parent || 'n/a'}**\n`

  if (type === ChannelType.GuildText) {
    const textChannel = channel as any
    const { rateLimitPerUser, nsfw } = textChannel
    desc += `> topic: **${textChannel.topic || 'none'}**\n`
    desc += `> position: **${position}**\n`
    desc += `> slowmode: **${rateLimitPerUser}s**\n`
    desc += `> nsfw: **${nsfw ? 'yes' : 'no'}**\n`
  }

  if (
    type === ChannelType.GuildPublicThread ||
    type === ChannelType.GuildPrivateThread ||
    type === ChannelType.AnnouncementThread
  ) {
    const threadChannel = channel as ThreadChannel
    const { ownerId, archived, locked } = threadChannel
    desc += `> owner: **${ownerId || 'unknown'}**\n`
    desc += `> archived: **${archived ? 'yes' : 'no'}**\n`
    desc += `> locked: **${locked ? 'yes' : 'no'}**\n`
  }

  if (
    type === ChannelType.GuildAnnouncement ||
    type === ChannelType.AnnouncementThread
  ) {
    const newsChannel = channel as any
    const { nsfw } = newsChannel
    desc += `> nsfw: **${nsfw ? 'yes' : 'no'}**\n`
  }

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    const voiceChannel = channel as any
    const { bitrate, userLimit, full } = voiceChannel
    desc += `> position: **${position}**\n`
    desc += `> bitrate: **${bitrate}**\n`
    desc += `> user limit: **${userLimit}**\n`
    desc += `> full: **${full ? 'yes' : 'no'}**\n`
  }

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.channel.title') })
    .setDescription(desc)

  return { embeds: [embed] }
}
