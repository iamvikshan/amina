// In-memory cache for edge (per isolate)
// Map allows caching stats for multiple bots simultaneously
const botStatsCache = new Map<string, { data: BotStats; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Create a default/offline bot stats object.
 * Extracted to avoid duplicating the same literal in multiple fallback paths.
 */
function makeOfflineStats(): BotStats & { cached: boolean } {
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

/**
 * Fetch bot statistics from external bot API or database.
 * The bot updates stats every 10 minutes via presence handler.
 *
 * The stats URL is read from `env.BOT_STATS_URL` (a server-side
 * environment binding) to prevent SSRF via user-supplied URLs.
 *
 * @param env - Environment bindings (including BOT_STATS_URL)
 * @param options - Optional overrides (e.g. url for internal use)
 */
export async function getBotStats(
  env: Env,
  options?: BotStatsOptions
): Promise<BotStats & { cached: boolean; cacheAge?: number }> {
  const botApiUrl = options?.url || env.BOT_STATS_URL
  const cacheKey = botApiUrl || 'default'

  // Check in-memory cache first
  const cachedEntry = botStatsCache.get(cacheKey)
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
    return {
      ...cachedEntry.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cachedEntry.timestamp) / 1000),
    }
  }

  // Check KV cache if available
  if (env.CACHE) {
    const cached = await env.CACHE.get(`bot-stats:${cacheKey}`, 'json')
    if (cached) {
      const { timestamp, ...data } = cached as BotStats & { timestamp: number }
      const age = Date.now() - timestamp
      if (age < CACHE_DURATION) {
        botStatsCache.set(cacheKey, { data, timestamp })
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
    return makeOfflineStats()
  }

  // Validate the bot API URL to prevent SSRF
  let parsedUrl: URL
  try {
    parsedUrl = new URL(`${botApiUrl}/stats`)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      console.warn(
        `[bot-stats] SSRF blocked: invalid scheme in URL: ${botApiUrl}`
      )
      return makeOfflineStats()
    }
    // Block private/internal IPs (basic check)
    // Note: URL.hostname returns IPv6 addresses WITHOUT brackets
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
      console.warn(
        `[bot-stats] SSRF blocked: private/internal address in URL: ${botApiUrl}`
      )
      return makeOfflineStats()
    }
  } catch (_urlError) {
    console.warn(`[bot-stats] SSRF blocked: malformed URL: ${botApiUrl}`)
    return makeOfflineStats()
  }

  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Amina-API/1.0',
      },
      signal: AbortSignal.timeout(5000),
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
    botStatsCache.set(cacheKey, { data: stats, timestamp: Date.now() })

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
    const staleEntry = botStatsCache.get(cacheKey)
    if (staleEntry) {
      return {
        ...staleEntry.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - staleEntry.timestamp) / 1000),
      }
    }

    // Return fallback
    return makeOfflineStats()
  }
}
