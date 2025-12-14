// @lib/cookie-utils.ts
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { TokenData } from '@types';

export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  USER_DATA: 'user_data',
} as const;

export const COOKIE_OPTIONS = {
  path: '/',
  secure: (process.env.NODE_ENV || 'development') === 'production', // Only use secure in production
  httpOnly: true,
  sameSite: 'Lax' as const,
};

export function getAuthCookies(c: Context) {
  const accessToken = getCookie(c, AUTH_COOKIE_NAMES.ACCESS_TOKEN);
  const refreshToken = getCookie(c, AUTH_COOKIE_NAMES.REFRESH_TOKEN);
  const userId = getCookie(c, AUTH_COOKIE_NAMES.USER_ID);
  const userDataStr = getCookie(c, AUTH_COOKIE_NAMES.USER_DATA);

  return {
    accessToken,
    refreshToken,
    userId,
    userData: userDataStr ? JSON.parse(userDataStr) : null,
  };
}

export function setAuthCookies(
  c: Context,
  tokenData: TokenData,
  userData: any
): void {
  // Set access token
  setCookie(c, AUTH_COOKIE_NAMES.ACCESS_TOKEN, tokenData.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: tokenData.expires_in,
  });

  // Set refresh token
  setCookie(c, AUTH_COOKIE_NAMES.REFRESH_TOKEN, tokenData.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Set user data
  if (userData) {
    setCookie(c, AUTH_COOKIE_NAMES.USER_ID, userData.id, {
      ...COOKIE_OPTIONS,
      maxAge: tokenData.expires_in,
    });

    setCookie(c, AUTH_COOKIE_NAMES.USER_DATA, JSON.stringify(userData), {
      ...COOKIE_OPTIONS,
      maxAge: tokenData.expires_in,
    });
  }
}

export function clearAuthCookies(c: Context): void {
  Object.values(AUTH_COOKIE_NAMES).forEach((cookieName) => {
    deleteCookie(c, cookieName, { path: '/' });
  });
}
