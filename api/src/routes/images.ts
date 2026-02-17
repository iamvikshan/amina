import { Hono } from 'hono'
import { errors } from '@lib/response'
import { createLogger } from '@lib/logger'
import { parseNumberOrDefault, svgResponse } from '@lib/svg-utils'
import { generateRankCard } from '@lib/cards/rank-card'
import { generateWelcomeCard } from '@lib/cards/welcome-card'

const images = new Hono<{ Bindings: Env }>()

/**
 * GET /images/rank-card
 * Generate a rank card image for a user
 *
 * Query params:
 * - userId: Discord user ID
 * - guildId: Guild ID for guild-specific rank
 * - username: Display name
 * - discriminator: Discord discriminator (legacy)
 * - avatar: Avatar URL or hash
 * - level: Current level
 * - xp: Current XP
 * - requiredXp: XP needed for next level
 * - rank: Leaderboard position
 * - background?: Custom background URL or color
 * - theme?: Card theme (dark, light, custom)
 */
images.get('/rank-card', async c => {
  const query = c.req.query()

  // Validate required params
  const required = ['userId', 'username', 'level', 'xp', 'requiredXp', 'rank']
  const missing = required.filter(key => !query[key])

  if (missing.length > 0) {
    return errors.badRequest(
      c,
      `Missing required parameters: ${missing.join(', ')}`
    )
  }

  try {
    const svg = generateRankCard({
      username: query.username || '',
      level: parseNumberOrDefault(query.level, 0, 0),
      xp: parseNumberOrDefault(query.xp, 0, 0),
      requiredXp: parseNumberOrDefault(query.requiredXp, 1, 1),
      rank: parseNumberOrDefault(query.rank, 1, 1),
      avatar: query.avatar,
      discriminator: query.discriminator,
      background: query.background,
      theme: ['dark', 'light', 'amina'].includes(query.theme as string)
        ? (query.theme as 'dark' | 'light' | 'amina')
        : undefined,
    })

    return svgResponse(svg, 60)
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Failed to generate rank card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/images/rank-card',
      }
    )
    return errors.internal(c, 'Failed to generate rank card')
  }
})

/**
 * GET /images/welcome
 * Generate a welcome image for new members
 */
images.get('/welcome', async c => {
  const query = c.req.query()

  const username = query.username || 'Member'
  const memberCount = query.memberCount || '0'
  const guildName = query.guildName || 'Server'

  try {
    const svg = generateWelcomeCard({
      username,
      memberCount: parseInt(memberCount, 10) || 0,
      guildName,
      avatar: query.avatar,
      type: 'welcome',
      message: query.message,
      background: query.background,
    })

    return svgResponse(svg, 60)
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Failed to generate welcome card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/images/welcome',
      }
    )
    return errors.internal(c, 'Failed to generate welcome card')
  }
})

/**
 * GET /images/leaderboard
 * Generate a leaderboard image
 */
images.get('/leaderboard', async c => {
  // TODO: Implement leaderboard image generation
  return errors.notFound(c, 'Leaderboard image generation not yet implemented')
})

export default images
