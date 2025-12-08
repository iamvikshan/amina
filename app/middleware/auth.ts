// app/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { discordAuth } from '@/lib/discord-auth';
import {
  getAuthCookies,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/cookie-utils';
import type { RouteConfig } from '@types';

const authUrl = discordAuth.getAuthUrl();

// Define your routes configuration
// IMPORTANT: More specific paths must come BEFORE general ones
const routes: RouteConfig[] = [
  // Protected routes - check these first
  { path: '/dash', requiresAuth: true, forceDynamic: true },
  { path: '/guild', requiresAuth: true, forceDynamic: true },
  { path: '/user', requiresAuth: true, forceDynamic: true },
  // Webhook endpoint - MUST come before /api/guild (handles its own Bearer token auth)
  { path: '/api/guild/refresh', requiresAuth: false }, // Supports both webhook and manual refresh
  { path: '/api/guild', requiresAuth: true, forceDynamic: true },
  { path: '/api/user', requiresAuth: true, forceDynamic: true },
  // Public routes
  { path: '/auth', requiresAuth: false },
  { path: '/api', requiresAuth: false },
  { path: '/', requiresAuth: false },
];

/**
 * Authentication middleware for HonoX
 * 
 * CRITICAL: This middleware preserves the exact authentication flow from Astro:
 * - Token validation with refresh on expiry
 * - Two-tier rate limiting (per-user + global)
 * - Route-based protection (configurable via routes array)
 * - Secure cookie handling (httpOnly, secure, sameSite)
 * 
 * DO NOT MODIFY without thorough testing!
 */
export const authGuard = createMiddleware(async (c: Context, next) => {
  const url = new URL(c.req.url);
  
  // Find matching route config
  const matchingRoute = routes.find((route) =>
    url.pathname.startsWith(route.path)
  );

  // If no matching route or doesn't require auth, continue
  if (!matchingRoute || !matchingRoute.requiresAuth) {
    await next();
    return;
  }

  const { accessToken, refreshToken, userId } = getAuthCookies(c);

  // No tokens present - redirect to login
  if (!accessToken || !refreshToken) {
    return c.redirect(authUrl);
  }

  try {
    const isValid = await discordAuth.validateToken(accessToken, userId);

    if (!isValid) {
      try {
        // Token expired - attempt refresh
        const newTokens = await discordAuth.refreshToken(refreshToken);
        const userData = await discordAuth.getUserInfo(
          newTokens.access_token,
          userId
        );
        setAuthCookies(c, newTokens, userData);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearAuthCookies(c);
        return c.redirect('/');
      }
    }

    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    clearAuthCookies(c);
    return c.redirect('/');
  }
});

/**
 * Optional: Middleware to attach user data to context
 * Usage: Apply after authGuard for authenticated routes
 */
export const attachUser = createMiddleware(async (c: Context, next) => {
  const { accessToken, userId } = getAuthCookies(c);

  if (accessToken && userId) {
    try {
      const userData = await discordAuth.getUserInfo(accessToken, userId);
      c.set('user', userData);
    } catch (error) {
      console.error('Failed to attach user data:', error);
      // Continue anyway - user might be on public route
    }
  }

  await next();
});
