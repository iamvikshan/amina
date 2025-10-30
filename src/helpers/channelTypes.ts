import { ChannelType } from 'discord.js'

/**
 * Converts a Discord ChannelType enum to a human-readable string
 * @param type - The Discord ChannelType enum value
 * @returns A readable string representation of the channel type
 */
export default function channelTypes(type: ChannelType): string {
  switch (type) {
    case ChannelType.GuildText:
      return 'Guild Text'
    case ChannelType.GuildVoice:
      return 'Guild Voice'
    case ChannelType.GuildCategory:
      return 'Guild Category'
    case ChannelType.GuildAnnouncement:
      return 'Guild Announcement'
    case ChannelType.AnnouncementThread:
      return 'Guild Announcement Thread'
    case ChannelType.PublicThread:
      return 'Guild Public Thread'
    case ChannelType.PrivateThread:
      return 'Guild Private Thread'
    case ChannelType.GuildStageVoice:
      return 'Guild Stage Voice'
    case ChannelType.GuildDirectory:
      return 'Guild Directory'
    case ChannelType.GuildForum:
      return 'Guild Forum'
    default:
      return 'Unknown'
  }
}

// Named export for flexibility
export { channelTypes }
