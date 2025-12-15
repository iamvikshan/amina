/**
 * Cookie utilities for HonoX (using Hono's cookie helpers)
 * Based on reference: .reference/frontend/src/utils/auth/server.ts
 */

import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { tokenSchema, type AccessToken, discordAuth } from './discord-auth';

const TOKEN_COOKIE = 'ts-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Session utilities for Hono context
 */
export const sessionUtils = {
  /**
   * Check if request has valid session
   */
  hasSession(c: Context): boolean {
    const raw = getCookie(c, TOKEN_COOKIE);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw);
      return tokenSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  },

  /**
   * Get session from cookie
   */
  getSession(c: Context): AccessToken | null {
    const raw = getCookie(c, TOKEN_COOKIE);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const result = tokenSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  },

  /**
   * Set session cookie
   */
  setSession(c: Context, token: AccessToken): void {
    setCookie(c, TOKEN_COOKIE, JSON.stringify(token), {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    });
  },

  /**
   * Remove session and revoke token
   */
  async removeSession(c: Context): Promise<void> {
    const session = this.getSession(c);
    if (session) {
      deleteCookie(c, TOKEN_COOKIE);
      await discordAuth.revokeToken(session.access_token);
    }
  },

  /**
   * Clear session cookie only (no revoke)
   */
  clearSession(c: Context): void {
    deleteCookie(c, TOKEN_COOKIE);
  },
};

/**
 * Get user data from Discord API using access token
 */
export async function fetchDiscordUser(accessToken: string) {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord user');
  }

  return response.json();
}

/**
 * Get user guilds from Discord API
 */
export async function fetchDiscordGuilds(accessToken: string) {
  const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord guilds');
  }

  return response.json();
}
