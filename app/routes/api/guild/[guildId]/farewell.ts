import type { Context } from 'hono';
import { GuildManager } from '@lib/database/mongoose';
import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('guildId');
    const body = (await c.req.json().catch(() => ({}))) as any;
    const { farewell } = body;

    if (!guildId || !farewell) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    const guildManager = await GuildManager.getInstance();
    const currentGuild = await guildManager.getGuild(guildId);

    if (!currentGuild) {
      return c.json({ error: 'Guild not found' }, 404);
    }

    const updatedGuild = await guildManager.updateGuild(guildId, { farewell });

    console.log(`✅ Updated farewell settings for guild ${guildId}`);

    return c.json(
      {
        success: true,
        guild: updatedGuild,
        message: 'Farewell settings updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error updating farewell:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});
