/**
 * GET /api/user/guilds
 * Fetch user's guilds where they can manage the bot
 */

import { createRoute } from 'honox/factory';
import { sessionUtils } from '@lib/cookie-utils';
import type { DiscordGuild } from '@types';

export default createRoute(async (c) => {
  try {
    // Get session from middleware (AccessToken)
    const session = sessionUtils.getSession(c);
    if (!session?.access_token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Fetch user's guilds from Discord API
    const response = await fetch(
      'https://discord.com/api/v10/users/@me/guilds',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch guilds from Discord:', response.status);
      return c.json({ error: 'Failed to fetch guilds' }, 500);
    }

    const allGuilds: DiscordGuild[] = await response.json();

    // Filter guilds where user has MANAGE_SERVER permission (0x20)
    // This permission (bit 5) allows managing bot integrations
    const manageableGuilds = allGuilds.filter((guild) => {
      const permissions = BigInt(guild.permissions || '0');
      const MANAGE_GUILD = BigInt(0x20);
      return (permissions & MANAGE_GUILD) === MANAGE_GUILD;
    });

    // TODO: Filter by guilds where bot is installed
    // For now, return all manageable guilds
    return c.json(manageableGuilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
