/**
 * Rate Limiter using Cloudflare KV
 *
 * Uses a fixed window (time bucket) algorithm with KV storage.
 * Requests are counted per fixed time bucket defined by config.window,
 * where windowStart = now - (now % config.window).
 * Falls back to in-memory if KV is not available.
 */

// In-memory fallback store (per-isolate, not distributed)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check and update rate limit for a key
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % config.window)
  const resetAt = windowStart + config.window
  const kvKey = `ratelimit:${key}:${windowStart}`

  if (kv) {
    return checkRateLimitKV(kv, kvKey, config, resetAt)
  }

  return checkRateLimitMemory(kvKey, config, now, resetAt)
}

/**
 * KV-based rate limiting (distributed)
 *
 * NOTE: Workers KV is eventually consistent. The get-then-put pattern here
 * can allow concurrent requests to exceed the limit under high concurrency.
 * For strict rate limiting, consider Cloudflare Durable Objects or the
 * built-in Rate Limiting API. This implementation is sufficient for
 * best-effort rate limiting in typical API usage patterns.
 */
async function checkRateLimitKV(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig,
  resetAt: number
): Promise<RateLimitResult> {
  // Get current count (guard against NaN from corrupted KV data)
  const current = await kv.get(key)
  const parsed = current ? parseInt(current, 10) : 0
  const count = Number.isNaN(parsed) ? 0 : parsed

  if (count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      reset: resetAt,
      limit: config.requests,
    }
  }

  // Increment count with TTL
  await kv.put(key, String(count + 1), {
    expirationTtl: config.window + 60, // Add buffer for clock skew
  })

  return {
    allowed: true,
    remaining: config.requests - count - 1,
    reset: resetAt,
    limit: config.requests,
  }
}

/**
 * Memory-based rate limiting (fallback, per-isolate)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
  now: number,
  resetAt: number
): RateLimitResult {
  const entry = memoryStore.get(key)

  // Clean expired entries
  if (entry && entry.resetAt <= now) {
    memoryStore.delete(key)
  }

  const current = memoryStore.get(key)

  if (current) {
    if (current.count >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        reset: current.resetAt,
        limit: config.requests,
      }
    }

    current.count++
    return {
      allowed: true,
      remaining: config.requests - current.count,
      reset: current.resetAt,
      limit: config.requests,
    }
  }

  // Create new entry
  memoryStore.set(key, { count: 1, resetAt })

  // Cleanup old entries periodically
  if (memoryStore.size > 10000) {
    const cutoff = now
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt <= cutoff) {
        memoryStore.delete(k)
      }
    }
  }

  return {
    allowed: true,
    remaining: config.requests - 1,
    reset: resetAt,
    limit: config.requests,
  }
}

/**
 * Generate rate limit headers
 */
export function rateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  }

  if (!result.allowed) {
    const retrySeconds = Math.max(
      0,
      result.reset - Math.floor(Date.now() / 1000)
    )
    headers['Retry-After'] = String(retrySeconds)
  }

  return headers
}
