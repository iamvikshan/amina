// @lib/discord-auth.ts
import { z } from 'zod';
import { env as runtimeEnv } from '@config/env';
import { getOAuthRedirect } from '@config/permalinks';
import type { TokenData } from '@types';

const envSchema = z.object({
  CLIENT_ID: z.string().min(1),
  CLIENT_SECRET: z.string().min(1),
});

interface DiscordAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class DiscordAuth {
  private config: DiscordAuthConfig;
  // Changed to per-user rate limiting: Map<userId, Map<endpoint, timestamp>>
  private rateLimitMap = new Map<string, Map<string, number>>();
  // Global rate limit tracking: stores timestamps of last 50 requests
  private globalRequestTimestamps: number[] = [];
  private readonly GLOBAL_RATE_LIMIT = 50; // Discord's global limit: 50 req/sec

  constructor() {
    // Read from runtime env (container) via central env module
    const clientId = runtimeEnv.CLIENT_ID;
    const clientSecret = runtimeEnv.CLIENT_SECRET;

    // Only validate if we're in a runtime context (not during build)
    // During SSR/build, these will be empty strings and validation happens at actual request time
    if (clientId || clientSecret) {
      try {
        const env = envSchema.parse({
          CLIENT_ID: clientId,
          CLIENT_SECRET: clientSecret,
        });

        this.config = {
          clientId: env.CLIENT_ID,
          clientSecret: env.CLIENT_SECRET,
          redirectUri: getOAuthRedirect(),
          scopes: ['identify', 'guilds', 'email'],
        };
      } catch (error) {
        console.error('Environment validation failed:', error);
        throw new Error(
          'Required environment variables are missing or invalid'
        );
      }
    } else {
      // Build-time placeholder - will be initialized at runtime
      this.config = {
        clientId: '',
        clientSecret: '',
        redirectUri: getOAuthRedirect(),
        scopes: ['identify', 'guilds', 'email'],
      };
    }
  }

  private async makeDiscordRequest(
    endpoint: string,
    options: RequestInit,
    skipRateLimit = false,
    userId: string = 'anonymous'
  ): Promise<Response> {
    if (!skipRateLimit) {
      const now = Date.now();

      // === Global Rate Limit Check ===
      // Remove timestamps older than 1 second
      this.globalRequestTimestamps = this.globalRequestTimestamps.filter(
        (timestamp) => now - timestamp < 1000
      );

      // If we've made 50 requests in the last second, wait
      if (this.globalRequestTimestamps.length >= this.GLOBAL_RATE_LIMIT) {
        const oldestTimestamp = this.globalRequestTimestamps[0];
        const waitTime = 1000 - (now - oldestTimestamp);
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        // Clean up again after waiting
        this.globalRequestTimestamps = this.globalRequestTimestamps.filter(
          (timestamp) => Date.now() - timestamp < 1000
        );
      }

      // === Per-User Per-Endpoint Rate Limit Check ===
      // Get or create user's rate limit map
      let userRateLimits = this.rateLimitMap.get(userId);
      if (!userRateLimits) {
        userRateLimits = new Map<string, number>();
        this.rateLimitMap.set(userId, userRateLimits);
      }

      const lastRequest = userRateLimits.get(endpoint) || 0;
      const timeGap = now - lastRequest;

      if (timeGap < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - timeGap));
      }

      userRateLimits.set(endpoint, Date.now());

      // Track this request in global timestamps
      this.globalRequestTimestamps.push(Date.now());

      // Clean up old entries to prevent memory leak
      // Only clean when map gets large (> 50 users)
      if (this.rateLimitMap.size > 50) {
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        for (const [uid, endpoints] of this.rateLimitMap.entries()) {
          // Clean old endpoints for each user
          for (const [ep, timestamp] of endpoints.entries()) {
            if (timestamp < fiveMinutesAgo) {
              endpoints.delete(ep);
            }
          }

          // Remove user entirely if no endpoints left
          if (endpoints.size === 0) {
            this.rateLimitMap.delete(uid);
          }
        }
      }
    }

    const response = await fetch(`https://discord.com/api/v10/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'User-Agent':
          'DiscordBot (https://github.com/iamvikshan/amina, v1.0.0)',
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise((resolve) =>
        setTimeout(resolve, parseInt(retryAfter || '1') * 1000)
      );
      return this.makeDiscordRequest(endpoint, options, true, userId);
    }

    return response;
  }

  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  public async exchangeCode(code: string): Promise<TokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });

    const response = await this.makeDiscordRequest(
      'oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
      true
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      if (error.error === 'invalid_client') {
        throw new Error(
          'Invalid Discord credentials. Please check your CLIENT_ID and CLIENT_SECRET in .env file.'
        );
      }

      throw new Error(
        `Token exchange failed: ${error.error_description || error.error || response.statusText}`
      );
    }

    return response.json();
  }

  public async refreshToken(refreshToken: string): Promise<TokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await this.makeDiscordRequest(
      'oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
      true
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      if (error.error === 'invalid_client') {
        throw new Error(
          'Invalid Discord credentials. Please check your CLIENT_ID and CLIENT_SECRET in .env file.'
        );
      }

      throw new Error(
        `Token refresh failed: ${error.error_description || error.error || response.statusText}`
      );
    }

    return response.json();
  }

  public async getUserInfo(accessToken: string, userId?: string) {
    // Use provided userId or hash of token as fallback
    const rateLimitId = userId || `token_${accessToken.slice(-8)}`;

    const response = await this.makeDiscordRequest(
      'users/@me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      false,
      rateLimitId
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  public async validateToken(
    accessToken: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Use provided userId or hash of token as fallback
      const rateLimitId = userId || `token_${accessToken.slice(-8)}`;

      const response = await this.makeDiscordRequest(
        'oauth2/@me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        false,
        rateLimitId
      );

      return response.ok;
    } catch (error) {
      if (
        (process.env.NODE_ENV || 'development') !== 'production' &&
        accessToken
      ) {
        return true;
      }
      return false;
    }
  }
}

export const discordAuth = new DiscordAuth();
