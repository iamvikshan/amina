/**
 * Feature Configuration API
 * GET    /api/guild/:guildId/features/:feature - Get feature config
 * PATCH  /api/guild/:guildId/features/:feature - Update feature config
 * POST   /api/guild/:guildId/features/:feature - Enable feature
 * DELETE /api/guild/:guildId/features/:feature - Disable feature
 */

import { createRoute } from 'honox/factory';
import { sessionUtils } from '@lib/cookie-utils';
import { isValidFeature } from '@/config/features';
import type { FeatureId } from '@types';

export default createRoute(async (c) => {
  const guildId = c.req.param('guildId');
  const featureId = c.req.param('feature') as FeatureId;

  if (!guildId || !featureId) {
    return c.json({ error: 'Guild ID and feature ID are required' }, 400);
  }

  if (!isValidFeature(featureId)) {
    return c.json({ error: 'Invalid feature ID' }, 400);
  }

  // Get session from middleware (AccessToken)
  const session = sessionUtils.getSession(c);
  if (!session?.access_token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const method = c.req.method;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(guildId, featureId);
      case 'PATCH':
        return await handleUpdate(c, guildId, featureId);
      case 'POST':
        return await handleEnable(guildId, featureId);
      case 'DELETE':
        return await handleDisable(guildId, featureId);
      default:
        return c.json({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error(`Error handling ${method} for feature ${featureId}:`, error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/** GET - Fetch feature configuration */
async function handleGet(guildId: string, featureId: FeatureId) {
  // TODO: Fetch guild from database
  // const guildManager = await GuildManager.getInstance();
  // const guild = await guildManager.getGuild(guildId);
  // if (!guild) {
  //   return Response.json({ error: 'Guild not found' }, { status: 404 });
  // }
  //
  // const config = guild[featureId] || {};
  // return Response.json(config);

  // Mock empty config for now
  const config: any = {};
  return Response.json(config);
}

/** PATCH - Update feature configuration */
async function handleUpdate(c: any, guildId: string, featureId: FeatureId) {
  const body = await c.req.json();

  // TODO: Update feature in database
  // const guildManager = await GuildManager.getInstance();
  // let updatedGuild;
  //
  // switch (featureId) {
  //   case 'welcome':
  //     updatedGuild = await guildManager.updateWelcome(guildId, body);
  //     break;
  //   case 'farewell':
  //     updatedGuild = await guildManager.updateGuild(guildId, { farewell: body });
  //     break;
  //   // ... other features
  // }
  //
  // if (!updatedGuild) {
  //   return Response.json({ error: 'Failed to update feature' }, { status: 500 });
  // }

  return Response.json({ success: true });
}

/** POST - Enable feature */
async function handleEnable(guildId: string, featureId: FeatureId) {
  // TODO: Enable feature in database
  // const guildManager = await GuildManager.getInstance();
  // const updatedGuild = await guildManager.updateGuild(guildId, {
  //   [`${featureId}.enabled`]: true
  // });
  //
  // if (!updatedGuild) {
  //   return Response.json({ error: 'Failed to enable feature' }, { status: 500 });
  // }

  return Response.json({ success: true });
}

/** DELETE - Disable feature */
async function handleDisable(guildId: string, featureId: FeatureId) {
  // TODO: Disable feature in database
  // const guildManager = await GuildManager.getInstance();
  // const updatedGuild = await guildManager.updateGuild(guildId, {
  //   [`${featureId}.enabled`]: false
  // });
  //
  // if (!updatedGuild) {
  //   return Response.json({ error: 'Failed to disable feature' }, { status: 500 });
  // }

  return Response.json({ success: true });
}
