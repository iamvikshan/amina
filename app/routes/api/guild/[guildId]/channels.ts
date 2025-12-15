/**
 * GET /api/guild/:guildId/channels
 * Fetch guild channels from Discord API (via bot token)
 */

import { createRoute } from 'honox/factory';
import { sessionUtils } from '@lib/cookie-utils';

export default createRoute(async (c) => {
  try {
    const guildId = c.req.param('guildId');
    if (!guildId) {
      return c.json({ error: 'Guild ID is required' }, 400);
    }

    // Get session from middleware (AccessToken)
    const session = sessionUtils.getSession(c);
    if (!session?.access_token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // TODO: Fetch channels from Discord API using bot token
    // const BOT_TOKEN = process.env.BOT_TOKEN;
    // const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    //   headers: {
    //     Authorization: `Bot ${BOT_TOKEN}`,
    //   },
    // });
    //
    // if (!response.ok) {
    //   return c.json({ error: 'Failed to fetch channels' }, response.status);
    // }
    //
    // const channels = await response.json();
    // return c.json(channels);

    // Mock data for now
    return c.json([{ id: '1', name: 'general', type: 0 }]);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
