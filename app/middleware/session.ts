/**
 * Session middleware for dashboard routes
 * Attaches user session data to context
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { sessionUtils } from '@lib/cookie-utils';
import { API_ENDPOINT } from '@lib/discord-auth';

/**
 * Attach session and user data to context
 * Fetches user from Discord API if session exists
 */
export const attachUserSession = createMiddleware(async (c: Context, next) => {
  const session = sessionUtils.getSession(c);

  if (session) {
    // Store token data in context
    c.set('session', session);

    // Fetch user data from Discord API
    try {
      const response = await fetch(`${API_ENDPOINT}/users/@me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        c.set('user', user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }

  await next();
});
