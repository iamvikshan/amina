import type { Context } from 'hono';
import { GuildManager } from '@lib/database/mongoose';
import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('guildId');

    if (!guildId) {
      return c.json({ error: 'Guild ID is required' }, 400);
    }

    const body = (await c.req.json().catch(() => ({}))) as any;
    const { automod } = body;

    if (!automod) {
      return c.json({ error: 'Automod data is required' }, 400);
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateAutomod(guildId, automod);

    if (!updatedGuild) {
      return c.json({ error: 'Guild not found' }, 404);
    }

    console.log(`✅ Updated automod settings for guild ${guildId}`);

    return c.json(
      {
        success: true,
        guild: updatedGuild,
        message: 'Automod settings updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error updating automod settings:', error);
    return c.json(
      {
        error: 'Failed to update automod settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
