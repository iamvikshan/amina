/**
 * Permalink Utilities
 * ===================
 * Helper functions for URL construction and manipulation.
 * Inspired by AstroWind's permalink pattern.
 */

import { SITE, URLS } from '@config/site';

// Get CLIENT_ID from environment (runtime only for HonoX)
const getClientId = (): string => {
  return process.env.CLIENT_ID || '1035629678632915055'; // Fallback to amina
};

/**
 * Get the canonical URL for any path
 * @param path - Path relative to site root (e.g., '/dash' or 'dash')
 * @returns Full canonical URL
 * @example getCanonical('/dash') → 'https://4mina.app/dash'
 */
export function getCanonical(path = ''): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const base = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url;
  return cleanPath ? `${base}/${cleanPath}` : base;
}

/**
 * Get the Discord OAuth redirect URL
 * Uses the site URL from config, no environment variables needed
 * @returns Full OAuth callback URL
 * @example getOAuthRedirect() → 'https://4mina.app/api/auth/callback'
 */
export function getOAuthRedirect(): string {
  return getCanonical('api/auth/callback');
}

/**
 * Get the support server URL
 * @returns Discord support server invite link
 */
export function getSupportUrl(): string {
  return URLS.support;
}

/**
 * Get the documentation URL
 * @returns Documentation site URL
 */
export function getDocsUrl(): string {
  return URLS.docs;
}

/**
 * Get the bot invite URL with dynamic CLIENT_ID
 * Discord handles the bot addition flow natively (no redirect)
 * @returns Discord bot invite link
 */
export function getInviteUrl(): string {
  const baseUrl = 'https://discord.com/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: getClientId(),
    permissions: '1374891928950', // Bot permissions
    scope: 'bot applications.commands',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get the GitHub repository URL
 * @returns GitHub repo URL
 */
export function getGitHubUrl(): string {
  return URLS.github;
}

/**
 * Get a social media URL by platform
 * @param platform - Social media platform key
 * @returns Social media URL
 */
export function getSocialUrl(
  platform: 'discord' | 'x' | 'github' | 'youtube'
): string {
  if (platform === 'discord') {
    return getSupportUrl(); // Discord support server link
  }
  return URLS.social[platform];
}
