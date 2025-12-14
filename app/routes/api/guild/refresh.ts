import type { Context } from 'hono';
import { clearGuildsCache } from '@/lib/data-utils';
import { GuildManager } from '@/lib/database/mongoose';
import { env, validateRequiredEnv } from '@/config/env';
import { getAuthCookies } from '@/lib/cookie-utils';
import { createRoute } from 'honox/factory';

// Rate limiting: Track last refresh time per guild (5 minute cooldown)
const guildRefreshCache = new Map<string, number>();
const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

// Rate limiting: Track user refresh attempts (prevent spam)
const userRefreshAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

async function isBotInGuild(guildId: string): Promise<boolean> {
  try {
    validateRequiredEnv();

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${env.CLIENT_ID}`,
      {
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
        },
      }
    );
    return response.ok;
  } catch (error) {
    console.error(`Error checking bot presence in guild ${guildId}:`, error);
    return false;
  }
}

async function syncGuildWithDiscord(guildId: string): Promise<{
  success: boolean;
  action?: string;
  error?: string;
}> {
  try {
    const guildManager = await GuildManager.getInstance();
    const guild = await guildManager.getGuild(guildId);

    if (!guild) {
      return { success: false, error: 'Guild not found in database' };
    }

    const botIsPresent = await isBotInGuild(guildId);

    if (botIsPresent) {
      if (guild.server.leftAt) {
        await guildManager.updateGuild(guildId, {
          server: {
            ...guild.server,
            leftAt: undefined,
            joinedAt: guild.server.joinedAt || new Date(),
          },
        });
        console.log(`✅ Cleared leftAt for guild ${guildId} - bot is present`);
        return { success: true, action: 'cleared_leftAt' };
      }
      return { success: true, action: 'no_change_needed' };
    }

    if (!guild.server.leftAt) {
      await guildManager.updateGuild(guildId, {
        server: {
          ...guild.server,
          leftAt: new Date(),
        },
      });
      console.log(`❌ Set leftAt for guild ${guildId} - bot is not present`);
      return { success: true, action: 'set_leftAt' };
    }

    return { success: true, action: 'no_change_needed' };
  } catch (error) {
    console.error(`Error syncing guild ${guildId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const POST = createRoute(async (c: Context) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const isWebhook = contentType.includes('application/json');

    let guildId: string | undefined;
    let redirectUrl = '/dash';
    let source: 'webhook' | 'manual' = 'manual';

    if (isWebhook) {
      const authHeader = c.req.header('Authorization');
      const expectedAuth = `Bearer ${env.WEBHOOK_SECRET}`;

      if (!authHeader || authHeader !== expectedAuth) {
        console.error('❌ Unauthorized refresh attempt');
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = (await c.req.json().catch(() => ({}))) as any;
      guildId = body.guildId;
      source = 'webhook';
      console.log(`🔔 Webhook refresh triggered for guild ${guildId}`);
    } else {
      const body = (await c.req.parseBody().catch(() => ({}))) as Record<
        string,
        string
      >;
      guildId = body.guildId;
      redirectUrl = body.redirect || '/dash';
      console.log(`🔄 Manual refresh requested for guild ${guildId}`);
    }

    if (!guildId) {
      const error = 'Missing guildId';
      if (isWebhook) {
        return c.json({ error }, 400);
      }
      return c.redirect(redirectUrl);
    }

    if (source === 'manual') {
      const lastRefresh = guildRefreshCache.get(guildId);
      if (lastRefresh && Date.now() - lastRefresh < REFRESH_COOLDOWN) {
        const waitTime = Math.ceil(
          (REFRESH_COOLDOWN - (Date.now() - lastRefresh)) / 1000
        );
        console.log(
          `⏱️ Guild ${guildId} recently refreshed, using cached data`
        );
        return c.redirect(
          `${redirectUrl}?info=recently_refreshed&wait=${waitTime}`
        );
      }

      const { userId } = getAuthCookies(c);
      const userKey = userId || 'unknown';
      const userAttempts = userRefreshAttempts.get(userKey);
      const now = Date.now();

      if (userAttempts) {
        if (now < userAttempts.resetAt) {
          if (userAttempts.count >= MAX_ATTEMPTS) {
            console.warn(`🚫 Rate limit exceeded for user ${userKey}`);
            return c.redirect(`${redirectUrl}?error=rate_limit`);
          }
          userAttempts.count++;
        } else {
          userRefreshAttempts.set(userKey, {
            count: 1,
            resetAt: now + ATTEMPT_WINDOW,
          });
        }
      } else {
        userRefreshAttempts.set(userKey, {
          count: 1,
          resetAt: now + ATTEMPT_WINDOW,
        });
      }
    }

    clearGuildsCache();

    const result = await syncGuildWithDiscord(guildId);

    if (source === 'manual') {
      guildRefreshCache.set(guildId, Date.now());
    }

    if (isWebhook) {
      return c.json(
        {
          success: result.success,
          guildId,
          action: result.action,
          error: result.error,
          processedAt: new Date().toISOString(),
        },
        result.success ? 200 : 500
      );
    }

    return c.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in refresh endpoint:', error);

    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
      return c.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }

    return c.redirect('/dash?error=refresh_failed');
  }
});
