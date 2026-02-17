import { Hono } from 'hono'
import { getBotStats } from '@lib/bot-stats'
import { success, errors } from '@lib/response'
import { createLogger } from '@lib/logger'

const bot = new Hono<{ Bindings: Env }>()

/**
 * GET /bot/stats
 * Raw bot statistics only
 *
 * Bot stats URL should come from bot's KV metadata, not from query params.
 */
bot.get('/stats', async c => {
  try {
    const stats = await getBotStats(c.env)

    return success(c, stats, {
      cached: stats.cached,
      cacheAge: stats.cacheAge,
    })
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Failed to fetch bot stats',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/bot/stats',
      }
    )
    return errors.internal(c, 'Failed to load bot statistics')
  }
})

/**
 * GET /bot/health
 * Simple health check endpoint
 */
bot.get('/health', c => {
  return success(c, {
    status: 'healthy',
    service: 'amina-api',
    timestamp: new Date().toISOString(),
  })
})

export default bot
