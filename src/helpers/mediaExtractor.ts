// @root/src/helpers/mediaExtractor.ts

import type { Message } from 'discord.js'

export interface MediaItem {
  url: string
  mimeType: string
  isVideo: boolean
  isGif: boolean
}

/**
 * Extract images, videos, and GIFs from a Discord message
 * Checks attachments and embed images
 */
export function extractMediaFromMessage(message: Message): MediaItem[] {
  const media: MediaItem[] = []

  // Check attachments
  for (const attachment of message.attachments.values()) {
    const url = attachment.url
    const contentType = attachment.contentType || ''
    const name = attachment.name?.toLowerCase() || ''

    // Check if it's an image
    if (
      contentType.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)
    ) {
      const isGif = contentType === 'image/gif' || name.endsWith('.gif')
      media.push({
        url,
        mimeType: contentType || 'image/jpeg',
        isVideo: false,
        isGif,
      })
    }
    // Check if it's a video
    else if (
      contentType.startsWith('video/') ||
      /\.(mp4|webm|mov|avi|mkv|gifv)$/i.test(name)
    ) {
      media.push({
        url,
        mimeType: contentType || 'video/mp4',
        isVideo: true,
        isGif: false,
      })
    }
  }

  // Check embed images
  for (const embed of message.embeds) {
    if (embed.image?.url) {
      const url = embed.image.url
      const isGif = url.toLowerCase().endsWith('.gif')
      media.push({
        url,
        mimeType: isGif ? 'image/gif' : 'image/jpeg',
        isVideo: false,
        isGif,
      })
    }
    // Check embed thumbnail
    if (embed.thumbnail?.url) {
      const url = embed.thumbnail.url
      const isGif = url.toLowerCase().endsWith('.gif')
      media.push({
        url,
        mimeType: isGif ? 'image/gif' : 'image/jpeg',
        isVideo: false,
        isGif,
      })
    }
  }

  return media
}

/**
 * Check if a message contains any media (images, videos, GIFs)
 */
export function hasMedia(message: Message): boolean {
  return extractMediaFromMessage(message).length > 0
}
