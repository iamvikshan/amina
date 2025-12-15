/**
 * GET /api/guild/:guildId
 * Fetch guild info with enabled features from database
 */

import { createRoute } from 'honox/factory';
import { sessionUtils } from '@lib/cookie-utils';
import type { CustomGuildInfo, FeatureId } from '@types';

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

    // TODO: Fetch guild from database
    // const guildManager = await GuildManager.getInstance();
    // const guild = await guildManager.getGuild(guildId);
    // if (!guild) {
    //   return c.json({ error: 'Guild not found' }, 404);
    // }

    // TODO: Map database fields to enabled features
    // Mock data for now
    const enabledFeatures: FeatureId[] = [];

    const response: CustomGuildInfo = {
      enabledFeatures,
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching guild:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
