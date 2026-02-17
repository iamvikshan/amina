// In-memory cache for edge (per isolate)
let botStatsCache: { data: BotStats; timestamp: number; key: string } | null =
  null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Fetch bot statistics from external bot API or database
 * The bot updates stats every 10 minutes via presence handler
 *
 * @param env - Environment bindings
 * @param options - Optional URL (can be passed via query params)
 */
export async function getBotStats(
  env: Env,
  options?: BotStatsOptions
): Promise<BotStats & { cached: boolean; cacheAge?: number }> {
  const botApiUrl = options?.url
  const cacheKey = botApiUrl || 'default'

  // Check in-memory cache first
  if (
    botStatsCache &&
    botStatsCache.key === cacheKey &&
    Date.now() - botStatsCache.timestamp < CACHE_DURATION
  ) {
    return {
      ...botStatsCache.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - botStatsCache.timestamp) / 1000),
    }
  }

  // Check KV cache if available
  if (env.CACHE) {
    const cached = await env.CACHE.get(`bot-stats:${cacheKey}`, 'json')
    if (cached) {
      const data = cached as BotStats & { timestamp: number }
      const age = Date.now() - data.timestamp
      if (age < CACHE_DURATION) {
        botStatsCache = { data, timestamp: data.timestamp, key: cacheKey }
        return {
          ...data,
          cached: true,
          cacheAge: Math.floor(age / 1000),
        }
      }
    }
  }

  if (!botApiUrl) {
    // Return default/fallback stats if no bot API configured
    // This allows the API to work even if bot isn't running
    return {
      guilds: 0,
      members: 0,
      channels: 0,
      ping: 0,
      uptime: 0,
      status: 'offline' as const,
      lastUpdated: new Date().toISOString(),
      cached: false,
    }
  }

  // Validate the bot API URL to prevent SSRF
  let parsedUrl: URL
  try {
    parsedUrl = new URL(`${botApiUrl}/stats`)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid bot API URL scheme: only http and https allowed')
    }
    // Block private/internal IPs (basic check)
    const hostname = parsedUrl.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fd00:') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal')
    ) {
      throw new Error('Bot API URL points to a private/internal address')
    }
  } catch (_urlError) {
    return {
      guilds: 0,
      members: 0,
      channels: 0,
      ping: 0,
      uptime: 0,
      status: 'offline' as const,
      lastUpdated: new Date().toISOString(),
      cached: false,
    }
  }

  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Amina-API/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      guilds?: number
      users?: number
      channels?: number
      ping?: number
      uptime?: number
      status?: string
      presence?: {
        status: string
        message: string
        type: string
        url: string
      }
      lastUpdated?: string
    }

    const stats: BotStats = {
      guilds: data.guilds || 0,
      members: data.users || 0,
      channels: data.channels || 0,
      ping: data.ping || 0,
      uptime: data.uptime || 0,
      status: ['online', 'idle', 'dnd', 'offline'].includes(
        data.status as string
      )
        ? (data.status as BotStats['status'])
        : 'online',
      presence: data.presence
        ? {
            type: data.presence.type,
            name: data.presence.message,
            url: data.presence.url || undefined,
          }
        : undefined,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    }

    // Update caches
    botStatsCache = { data: stats, timestamp: Date.now(), key: cacheKey }

    if (env.CACHE) {
      await env.CACHE.put(
        `bot-stats:${cacheKey}`,
        JSON.stringify({ ...stats, timestamp: Date.now() }),
        {
          expirationTtl: 600, // 10 minutes
        }
      )
    }

    return { ...stats, cached: false }
  } catch (error) {
    console.error('Failed to fetch bot stats:', error)

    // Return cached data if available, even if stale
    if (botStatsCache && botStatsCache.key === cacheKey) {
      return {
        ...botStatsCache.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - botStatsCache.timestamp) / 1000),
      }
    }

    // Return fallback
    return {
      guilds: 0,
      members: 0,
      channels: 0,
      ping: 0,
      uptime: 0,
      status: 'offline' as const,
      lastUpdated: new Date().toISOString(),
      cached: false,
    }
  }
}
