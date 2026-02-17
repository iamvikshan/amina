/**
 * Rate Limiting Middleware
 *
 * Implements configurable rate limiting using KV storage
 * Wraps the existing rate-limit library with middleware factories
 */

import type { Context, Next } from 'hono';
import { errors } from '../lib/response';
import { checkRateLimit, rateLimitHeaders } from '../lib/rate-limit';
import { HTTPException } from 'hono/http-exception';
import { createLogger } from '../lib/logger';

// Per-instance cryptographically random salt for secure hashing when no secret is configured.
// WARNING: This provides weaker security than a configured secret. works for now.
let PER_INSTANCE_SALT: string | null = null;

function getInstanceSalt(): string {
  if (!PER_INSTANCE_SALT) {
    PER_INSTANCE_SALT = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  }
  return PER_INSTANCE_SALT;
}

/**
 * Create a rate limiting middleware with given config
 */
export function rateLimit(config: RateLimitMiddlewareConfig) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'rl',
    keyGenerator = defaultKeyGenerator,
  } = config;

  return async function rateLimitMiddleware(
    c: Context<{ Bindings: Env }>,
    next: Next
  ) {
    const kv = c.env.RATE_LIMIT;

    if (!kv) {
      // No KV configured, skip rate limiting
      const logger = createLogger(c);
      logger.warn('RATE_LIMIT KV namespace not configured', {
        path: c.req.path,
        method: c.req.method,
      });
      await next();
      return;
    }

    const suffix = await keyGenerator(c);
    const key = `${keyPrefix}:${suffix}`;

    // Use existing rate limit library
    const config: RateLimitConfig = {
      requests: maxRequests,
      window: Math.floor(windowMs / 1000), // Convert ms to seconds
    };
    const result = await checkRateLimit(kv, key, config);

    // Set rate limit headers
    const headers = rateLimitHeaders(result);
    Object.entries(headers).forEach(([name, value]) => {
      if (value) c.header(name, value);
    });

    // Check if over limit
    if (!result.allowed) {
      return errors.rateLimit(
        c,
        `Rate limit exceeded. Try again in ${headers['Retry-After']} seconds`
      );
    }

    await next();
  };
}

/**
 * Default key generator - uses IP address and endpoint
 */
async function defaultKeyGenerator(
  c: Context<{ Bindings: Env }>
): Promise<string> {
  const ip =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0] ||
    'unknown';
  const path = new URL(c.req.url).pathname;

  // If IP is unknown, use a more specific fallback to prevent abuse
  if (ip === 'unknown') {
    // Gather additional request identifiers
    const identifiers = [
      c.req.header('User-Agent'),
      c.req.header('Accept-Language'),
      c.req.header('Referer'),
      c.req.header('X-Forwarded-For'),
      c.req.header('X-Request-Id'),
    ]
      .filter(Boolean)
      .join('|');

    if (!identifiers) {
      throw new HTTPException(403, { message: 'Missing client identifiers' });
    }

    // Use the same per-instance salt as botKeyGenerator for consistency
    const salt = c.env.CLIENT_SECRET || getInstanceSalt();
    const hash = await sha256(`${identifiers}:${salt}`);
    return `unknown:${hash.slice(0, 16)}:${path}`;
  }

  return `${ip}:${path}`;
}

/**
 * Key generator for API key authenticated requests
 */
export function apiKeyKeyGenerator(c: Context): string {
  const apiKey =
    c.req.header('Authorization')?.replace('Bearer ', '') ||
    c.req.query('api_key') ||
    'anonymous';
  const path = new URL(c.req.url).pathname;

  // Defense-in-depth: If no API key, fall back to IP-based limiting
  // This prevents multiple anonymous clients from sharing the same rate limit
  if (apiKey === 'anonymous') {
    // Try CF-Connecting-IP
    let id =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0];

    // Try socket address if available (standard in some environments)
    // @ts-ignore - socket property might not be in all Hono types but exists in some runtimes
    if (!id && c.req.raw?.socket?.remoteAddress) {
      // @ts-ignore
      id = c.req.raw.socket.remoteAddress;
    }

    // Try X-Request-Id (client supplied or upstream LB)
    if (!id) {
      id = c.req.header('X-Request-Id');
    }

    // Strict fail-closed: reject requests without any identifiers
    // This prevents DoS attacks via shared anonymous buckets
    if (!id) {
      throw new HTTPException(403, {
        message:
          'Missing client identifiers. Requests must include IP headers.',
      });
    }

    return `anonymous:${id}:${path}`;
  }

  return `${apiKey}:${path}`;
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Key generator for bot requests
 */
export async function botKeyGenerator(
  c: Context<{ Bindings: Env }>
): Promise<string> {
  const clientId = c.req.header('X-Client-Id') || 'unknown';
  const path = new URL(c.req.url).pathname;

  if (clientId !== 'unknown') {
    return `bot:${clientId}:${path}`;
  }

  // Defense-in-depth: If X-Client-Id is missing, use IP-based rate limiting
  const ip =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0] ||
    'unknown';

  if (ip !== 'unknown') {
    return `bot:missing-client-id:${ip}:${path}`;
  }

  // If IP is also unknown, try to fingerprint via User-Agent
  const ua = c.req.header('User-Agent');
  if (ua) {
    // Normalize UA and hash with salt to prevent collision attacks / leaking UA
    const normalizedUa = ua.trim().toLowerCase();
    // Use the same per-instance salt as defaultKeyGenerator for consistency
    const salt = c.env.CLIENT_SECRET || getInstanceSalt();
    const hash = await sha256(`${normalizedUa}:${salt}`);
    // Use first 16 chars of hash for brevity
    return `bot:missing-client-id:uaHash:${hash.slice(0, 16)}:${path}`;
  }

  // Strict fail-closed: reject bot requests without any identifiers
  // This prevents DoS attacks via shared anonymous buckets
  throw new HTTPException(403, {
    message: 'Bot authentication required. Missing X-Client-Id and IP headers.',
  });
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Public API rate limiter (anonymous)
 * 60 requests per minute
 */
export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 60,
  keyPrefix: 'rl:public',
});

/**
 * API key authenticated rate limiter
 * 300 requests per minute
 */
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 300,
  keyPrefix: 'rl:apikey',
  keyGenerator: apiKeyKeyGenerator,
});

/**
 * Bot internal endpoints rate limiter
 * 120 requests per minute (2 per second)
 */
export const botRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyPrefix: 'rl:bot',
  keyGenerator: botKeyGenerator,
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per minute
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'rl:strict',
});
