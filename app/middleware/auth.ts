/**
 * Authentication middleware for HonoX
 * Based on reference: .reference/frontend/src/utils/auth/middleware.ts
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { sessionUtils } from '@lib/cookie-utils';

/**
 * Protected routes that require authentication
 */
const PROTECTED_PATHS = ['/dash', '/api/guild', '/api/user'];

/**
 * Check if path requires authentication
 */
function requiresAuth(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Authentication guard middleware
 * Redirects to /api/auth/login if not authenticated
 */
export const authGuard = createMiddleware(async (c: Context, next) => {
  const url = new URL(c.req.url);

  // Skip auth check for public routes
  if (!requiresAuth(url.pathname)) {
    await next();
    return;
  }

  // Check if user has valid session
  if (!sessionUtils.hasSession(c)) {
    // Redirect to OAuth login
    return c.redirect('/api/auth/login');
  }

  await next();
});

/**
 * Attach user session to context
 * Use this after authGuard for authenticated routes
 */
export const attachSession = createMiddleware(async (c: Context, next) => {
  const session = sessionUtils.getSession(c);
  if (session) {
    c.set('session', session);
  }

  await next();
});
