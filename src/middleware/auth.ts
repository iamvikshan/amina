// @/middleware/auth.ts
import { defineMiddleware } from 'astro:middleware';
import { discordAuth } from '@/lib/discord-auth';
import {
  getAuthCookies,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/cookie-utils';

const authUrl = discordAuth.getAuthUrl();

// Add this type to better handle static/dynamic contexts
type RouteConfig = {
  path: string;
  requiresAuth: boolean;
  forceDynamic?: boolean;
};

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

export const authGuard = defineMiddleware(
  async ({ cookies, redirect, url }, next) => {
    // Find matching route config
    const matchingRoute = routes.find((route) =>
      url.pathname.startsWith(route.path)
    );

    // If no matching route or doesn't require auth, continue
    if (!matchingRoute || !matchingRoute.requiresAuth) {
      return next();
    }

    // For routes requiring auth, ensure we're in a dynamic context
    if (matchingRoute.forceDynamic && !cookies.get) {
      console.error(
        `Route ${url.pathname} requires dynamic rendering. Add 'export const prerender = false' to the page component.`
      );
      return redirect(authUrl);
    }

    const { accessToken, refreshToken, userId } = getAuthCookies(cookies);

    // No tokens present - redirect to login
    if (!accessToken || !refreshToken) {
      return redirect(authUrl);
    }

    try {
      const isValid = await discordAuth.validateToken(accessToken, userId);

      if (!isValid) {
        try {
          const newTokens = await discordAuth.refreshToken(refreshToken);
          const userData = await discordAuth.getUserInfo(
            newTokens.access_token,
            userId
          );
          setAuthCookies(cookies, newTokens, userData);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearAuthCookies(cookies);
          return redirect('/');
        }
      }

      return next();
    } catch (error) {
      console.error('Authentication error:', error);
      clearAuthCookies(cookies);
      return redirect('/');
    }
  }
);
