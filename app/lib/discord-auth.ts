/**
 * Discord OAuth2 Authentication Utilities (HonoX adaptation)
 * Based on reference: .reference/frontend/src/utils/auth/server.ts
 */

import { z } from 'zod';
import { getOAuthRedirect } from '@config/permalinks';

export const API_ENDPOINT = 'https://discord.com/api/v10';
export const CLIENT_ID = process.env.CLIENT_ID ?? '';
export const CLIENT_SECRET = process.env.CLIENT_SECRET ?? '';
// REDIRECT_URI is constructed from site config, not an env secret
export const REDIRECT_URI = getOAuthRedirect();

/**
 * Token schema matching Discord OAuth2 response
 */
export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

export type AccessToken = z.infer<typeof tokenSchema>;

/**
 * Discord OAuth2 helper
 */
export const discordAuth = {
  /**
   * Get authorization URL for Discord OAuth2
   */
  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds',
    });

    if (state) {
      params.set('state', state);
    }

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  },

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string, redirectUri: string): Promise<AccessToken> {
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    };

    const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const token = await response.json();
    return tokenSchema.parse(token);
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AccessToken> {
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const token = await response.json();
    return tokenSchema.parse(token);
  },

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      token: accessToken,
    };

    await fetch(`${API_ENDPOINT}/oauth2/token/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data),
    });
  },
};
