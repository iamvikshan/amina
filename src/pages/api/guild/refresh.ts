// src/pages/api/guild/refresh.ts
import type { APIRoute } from 'astro';
import { clearGuildsCache } from '@/lib/data-utils';
import { GuildManager } from '@/lib/database/mongoose';
import { env, validateRequiredEnv } from '@/env';

export const prerender = false;

/**
 * Check if the bot is a member of a guild using Discord API
 */
async function isBotInGuild(guildId: string): Promise<boolean> {
  try {
    validateRequiredEnv(); // Validate env vars before using them

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

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    const formData = await request.formData();
    const redirectUrl = formData.get('redirect')?.toString() || '/dash';
    const guildId = formData.get('guildId')?.toString();

    console.log('🔄 Guild refresh requested for:', guildId);

    // Clear cache first
    clearGuildsCache();

    // If a specific guild ID is provided, check bot presence and update database
    if (guildId) {
      const guildManager = await GuildManager.getInstance();
      const guild = await guildManager.getGuild(guildId);

      if (guild) {
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
            console.log(
              `✅ Cleared leftAt for guild ${guildId} - bot is present`
            );
          }
        } else {
          // Bot is not in the guild, set leftAt if not already set
          if (!guild.server.leftAt) {
            await guildManager.updateGuild(guildId, {
              server: {
                ...guild.server,
                leftAt: new Date(),
              },
            });
            console.log(
              `❌ Set leftAt for guild ${guildId} - bot is not present`
            );
          }
        }
      }
    }

    return redirect(redirectUrl);
  } catch (error) {
    console.error('Error refreshing guild:', error);
    return new Response(JSON.stringify({ error: 'Failed to refresh guild' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
