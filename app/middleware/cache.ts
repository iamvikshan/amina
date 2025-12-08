// app/middleware/cache.ts
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';

/**
 * Cache control middleware for static assets and API responses
 * 
 * Usage:
 * - Apply to static routes: cache for 1 hour
 * - Apply to API routes with custom TTL
 * - Skip for dynamic/authenticated routes
 */

export const cacheStatic = (maxAge: number = 3600) =>
  createMiddleware(async (c: Context, next) => {
    await next();

    // Only cache successful responses
    if (c.res.status === 200) {
      c.header('Cache-Control', `public, max-age=${maxAge}`);
    }
  });

export const cacheAPI = (maxAge: number = 300) =>
  createMiddleware(async (c: Context, next) => {
    await next();

    // Only cache successful GET requests
    if (c.req.method === 'GET' && c.res.status === 200) {
      c.header('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    }
  });

export const noCache = createMiddleware(async (c: Context, next) => {
  await next();
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
});
