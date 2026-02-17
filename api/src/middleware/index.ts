import type { Context, Next } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { createLogger } from '@lib/logger'

// Re-export auth middleware
export * from './auth'
export * from './botAuth'
export * from './rateLimit'

/**
 * CORS middleware for handling cross-origin requests
 * Allows requests from Amina dashboard and local development
 */
export async function cors(c: Context<{ Bindings: Env }>, next: Next) {
  const origin = c.req.header('Origin') || ''

  // Allowed origins
  const allowedOrigins = [
    'https://4mina.app',
    'https://www.4mina.app',
    'https://dash.4mina.app',
    'https://api.4mina.app',
    'http://localhost:4321', // Astro dev
    'http://localhost:3000',
    'http://localhost:8787', // Wrangler dev
    'http://127.0.0.1:4321',
    'http://127.0.0.1:8787',
  ]

  // Check if origin is allowed or if it's a same-origin request
  const isAllowed = allowedOrigins.includes(origin) || !origin

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-API-Key, X-Client-Id, X-Client-Secret',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }

    // Only reflect allowed origins — omit header entirely for disallowed origins
    if (isAllowed && origin) {
      headers['Access-Control-Allow-Origin'] = origin
    }

    return new Response(null, {
      status: 204,
      headers,
    })
  }

  await next()

  // Add CORS headers to response
  if (isAllowed && origin) {
    c.res.headers.set('Access-Control-Allow-Origin', origin)
    c.res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
}

/**
 * Request logging middleware
 */
export async function logger(c: Context<{ Bindings: Env }>, next: Next) {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  console.log(`${method} ${path} - ${status} (${duration}ms)`)
}

/**
 * Cache control middleware
 * Sets appropriate cache headers for different endpoints
 */
export async function cacheControl(c: Context<{ Bindings: Env }>, next: Next) {
  await next()

  // Skip if already has cache headers
  if (c.res.headers.has('Cache-Control')) {
    return
  }

  // Set cache headers based on path
  const path = c.req.path

  if (path.startsWith('/bot/metrics') || path.startsWith('/bot/status')) {
    // Bot stats: cache for 60s, stale for 5 min
    c.res.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
  } else if (path.startsWith('/guild')) {
    // Guild data: cache for 30s
    c.res.headers.set('Cache-Control', 'private, max-age=30')
  } else {
    // Default: no cache for dynamic data
    c.res.headers.set('Cache-Control', 'no-cache')
  }
}

/**
 * Error handling middleware
 */
export async function errorHandler(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    await next()
  } catch (error) {
    const logger = createLogger(c)
    logger.error(
      'Unhandled error in API',
      error instanceof Error ? error : undefined,
      {
        path: c.req.path,
        method: c.req.method,
      }
    )

    const status = ((error as { status?: number }).status ||
      500) as ContentfulStatusCode

    // Use generic message for 5xx to avoid leaking internal details
    // Only surface explicit error messages for 4xx client errors
    const message =
      status >= 500
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'

    // Derive error code from HTTP status
    let errorCode: string
    if (status >= 500) {
      errorCode = 'INTERNAL_ERROR'
    } else if (status === 400) {
      errorCode = 'BAD_REQUEST'
    } else if (status === 401) {
      errorCode = 'UNAUTHORIZED'
    } else if (status === 403) {
      errorCode = 'FORBIDDEN'
    } else if (status === 404) {
      errorCode = 'NOT_FOUND'
    } else {
      errorCode = 'CLIENT_ERROR'
    }

    return c.json(
      {
        success: false,
        error: {
          message,
          code: errorCode,
        },
        meta: {
          generatedAt: new Date().toISOString(),
        },
      },
      status
    )
  }
}
