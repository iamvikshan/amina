// src/pages/api/guild/refresh.ts
// Unified endpoint for guild refresh - handles both manual user refreshes and bot webhook triggers
import type { APIRoute } from 'astro';
import { clearGuildsCache } from '@/lib/data-utils';
import { GuildManager } from '@/lib/database/mongoose';
import { env, validateRequiredEnv } from '@/env';

export const prerender = false;

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

/**
 * Check if the bot is a member of a guild using Discord API
 */
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

/**
 * Sync guild state with Discord API
 */
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
      // Bot is in the guild, clear leftAt if it exists
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
    } else {
      // Bot is not in the guild, set leftAt if not already set
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
    }
  } catch (error) {
    console.error(`Error syncing guild ${guildId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    // Determine request type (JSON for webhook, FormData for manual)
    const contentType = request.headers.get('content-type') || '';
    const isWebhook = contentType.includes('application/json');

    let guildId: string | undefined;
    let redirectUrl = '/dash';
    let source: 'webhook' | 'manual' = 'manual';

    if (isWebhook) {
      // Webhook request - validate auth token
      const authHeader = request.headers.get('Authorization');
      const expectedAuth = `Bearer ${env.WEBHOOK_SECRET}`;

      if (!authHeader || authHeader !== expectedAuth) {
        console.error('❌ Unauthorized refresh attempt');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      guildId = body.guildId;
      source = 'webhook';
      console.log(`🔔 Webhook refresh triggered for guild ${guildId}`);
    } else {
      // Manual user request
      const formData = await request.formData();
      guildId = formData.get('guildId')?.toString();
      redirectUrl = formData.get('redirect')?.toString() || '/dash';
      source = 'manual';
      console.log(`🔄 Manual refresh requested for guild ${guildId}`);
    }

    if (!guildId) {
      const error = 'Missing guildId';
      if (isWebhook) {
        return new Response(JSON.stringify({ error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect(redirectUrl);
    }

    // Rate limiting for manual refreshes (not webhooks)
    if (source === 'manual') {
      // Check guild-level cooldown
      const lastRefresh = guildRefreshCache.get(guildId);
      if (lastRefresh && Date.now() - lastRefresh < REFRESH_COOLDOWN) {
        const waitTime = Math.ceil(
          (REFRESH_COOLDOWN - (Date.now() - lastRefresh)) / 1000
        );
        console.log(
          `⏱️ Guild ${guildId} recently refreshed, using cached data`
        );
        return redirect(
          `${redirectUrl}?info=recently_refreshed&wait=${waitTime}`
        );
      }

      // Check user-level rate limiting
      const userId = cookies.get('discord_user_id')?.value || 'unknown';
      const userAttempts = userRefreshAttempts.get(userId);
      const now = Date.now();

      if (userAttempts) {
        if (now < userAttempts.resetAt) {
          if (userAttempts.count >= MAX_ATTEMPTS) {
            console.warn(`🚫 Rate limit exceeded for user ${userId}`);
            return redirect(`${redirectUrl}?error=rate_limit`);
          }
          userAttempts.count++;
        } else {
          // Reset window
          userRefreshAttempts.set(userId, {
            count: 1,
            resetAt: now + ATTEMPT_WINDOW,
          });
        }
      } else {
        userRefreshAttempts.set(userId, {
          count: 1,
          resetAt: now + ATTEMPT_WINDOW,
        });
      }
    }

    // Clear cache
    clearGuildsCache();

    // Sync guild with Discord API
    const result = await syncGuildWithDiscord(guildId);

    // Update refresh cache
    if (source === 'manual') {
      guildRefreshCache.set(guildId, Date.now());
    }

    // Return appropriate response
    if (isWebhook) {
      return new Response(
        JSON.stringify({
          success: result.success,
          guildId,
          action: result.action,
          error: result.error,
          processedAt: new Date().toISOString(),
        }),
        {
          status: result.success ? 200 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Error in refresh endpoint:', error);

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return redirect('/dash?error=refresh_failed');
    }
  }
};
