/**
 * V1 Images API Routes
 *
 * All image generation endpoints with API key authentication.
 */

import { Hono } from 'hono'
import { requireApiKey, requirePermission } from '@middleware/auth'
import { errors } from '@lib/response'
import { createLogger } from '@lib/logger'
import { generateRankCard } from '@lib/cards/rank-card'
import { generateWelcomeCard } from '@lib/cards/welcome-card'
import { generateSpotifyCard } from '@lib/cards/spotify-card'
import {
  clampDimension,
  escapeXml,
  sanitizeUrl,
  parseNumberOrDefault,
  validateHexColor,
  svgResponse,
} from '@lib/svg-utils'

const images = new Hono<{ Bindings: Env }>()

// Apply API key authentication to all routes
images.use('*', requireApiKey)
images.use('*', requirePermission('images'))

/**
 * GET /v1/images/rank-card
 * Generate a rank card image
 */
images.get('/rank-card', async c => {
  const query = c.req.query()

  // Validate required params
  const username = query.username
  const level = parseNumberOrDefault(query.level, 0, 0)
  const xp = parseNumberOrDefault(query.xp, 0, 0)
  const requiredXp = parseNumberOrDefault(
    query.requiredXp || query.required_xp,
    100,
    1
  )
  const rank = parseNumberOrDefault(query.rank, 1, 1)

  if (!username) {
    return errors.badRequest(c, 'Missing required parameter: username')
  }

  try {
    const svg = generateRankCard({
      username,
      level,
      xp,
      requiredXp,
      rank,
      avatar: query.avatar,
      discriminator: query.discriminator,
      status: ['online', 'idle', 'dnd', 'offline'].includes(
        query.status as string
      )
        ? (query.status as 'online' | 'idle' | 'dnd' | 'offline')
        : undefined,
      background: query.background,
      progressColor:
        (query.progressColor || query.progress_color) &&
        validateHexColor(query.progressColor || query.progress_color || '')
          ? query.progressColor || query.progress_color
          : undefined,
      textColor:
        (query.textColor || query.text_color) &&
        validateHexColor(query.textColor || query.text_color || '')
          ? query.textColor || query.text_color
          : undefined,
      theme: ['dark', 'light', 'amina'].includes(query.theme as string)
        ? (query.theme as 'dark' | 'light' | 'amina')
        : undefined,
    })

    return svgResponse(svg, 60, 300)
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Failed to generate rank card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/rank-card',
      }
    )
    return errors.internal(c, 'Failed to generate rank card')
  }
})

/**
 * Shared handler for welcome/farewell card generation
 */
function handleGreetingCard(
  type: 'welcome' | 'farewell',
  defaultAccentColor?: string
) {
  return async (c: { req: { query: () => Record<string, string> } }) => {
    const query = c.req.query()

    const username = query.username
    const memberCount = parseNumberOrDefault(
      query.memberCount || query.member_count,
      0,
      0
    )
    const guildName = query.guildName || query.guild_name || 'Server'

    if (!username) {
      return errors.badRequest(
        c as Parameters<typeof errors.badRequest>[0],
        'Missing required parameter: username'
      )
    }

    try {
      const svg = generateWelcomeCard({
        username,
        memberCount,
        guildName,
        avatar: query.avatar,
        type,
        message: query.message,
        background: query.background,
        accentColor:
          query.accentColor || query.accent_color || defaultAccentColor,
        textColor: query.textColor || query.text_color,
      })

      return svgResponse(svg, 60, 300)
    } catch (error) {
      const logger = createLogger(c as Parameters<typeof createLogger>[0])
      logger.error(
        `Failed to generate ${type} card`,
        error instanceof Error ? error : undefined,
        {
          endpoint: `/v1/images/${type}-card`,
        }
      )
      return errors.internal(
        c as Parameters<typeof errors.internal>[0],
        `Failed to generate ${type} card`
      )
    }
  }
}

/**
 * GET /v1/images/welcome-card
 * Generate a welcome card image
 */
images.get('/welcome-card', handleGreetingCard('welcome'))

/**
 * GET /v1/images/farewell-card
 * Generate a farewell card image
 */
images.get('/farewell-card', handleGreetingCard('farewell', '#ed4245'))

/**
 * GET /v1/images/spotify-card
 * Generate a Spotify "Now Playing" card
 */
images.get('/spotify-card', async c => {
  const query = c.req.query()

  const title = query.title
  const artist = query.artist

  if (!title || !artist) {
    return errors.badRequest(c, 'Missing required parameters: title, artist')
  }

  try {
    const svg = generateSpotifyCard({
      title,
      artist,
      album: query.album,
      albumArt: query.albumArt || query.album_art,
      progress: query.progress
        ? parseNumberOrDefault(query.progress, 0, 0, 1)
        : undefined,
      duration: query.duration,
      currentTime: query.currentTime || query.current_time,
      isPlaying: query.isPlaying === 'true' || query.is_playing === 'true',
    })

    return svgResponse(svg, 60, 300)
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Failed to generate Spotify card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/spotify-card',
      }
    )
    return errors.internal(c, 'Failed to generate Spotify card')
  }
})

/**
 * GET /v1/images/color
 * Generate a solid color image
 */
images.get('/color', async c => {
  const hex = c.req.query('hex') || c.req.query('color') || 'DC143C'
  const width = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 256, 1, 1024),
    1,
    1024,
    256
  )
  const height = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 256, 1, 1024),
    1,
    1024,
    256
  )

  // Validate hex color
  const cleanHex = hex.replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return errors.badRequest(c, 'Invalid hex color. Use format: RRGGBB')
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#${cleanHex}"/>
  </svg>`

  return svgResponse(svg, 86400)
})

/**
 * GET /v1/images/circle
 * Circle crop an image
 */
images.get('/circle', async c => {
  const imageUrl = c.req.query('image') || c.req.query('url')
  const s = clampDimension(
    parseNumberOrDefault(c.req.query('size'), 256, 16, 1024),
    16,
    1024,
    256
  )

  if (!imageUrl) {
    return errors.badRequest(c, 'Missing required parameter: image')
  }

  const r = s / 2

  const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <clipPath id="circle">
        <circle cx="${r}" cy="${r}" r="${r}"/>
      </clipPath>
    </defs>
    <image xlink:href="${escapeXml(sanitizeUrl(imageUrl))}" width="${s}" height="${s}" clip-path="url(#circle)" preserveAspectRatio="xMidYMid slice"/>
  </svg>`

  return svgResponse(svg)
})

export default images
