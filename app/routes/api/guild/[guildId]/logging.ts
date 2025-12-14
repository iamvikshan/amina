import type { Context } from 'hono';
import { GuildManager } from '@lib/database/mongoose';
import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('guildId');
    const body = (await c.req.json().catch(() => ({}))) as any;
    const { logs } = body;

    if (!guildId || !logs) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateLogs(guildId, logs);

    if (!updatedGuild) {
      return c.json({ error: 'Guild not found' }, 404);
    }

    console.log(`✅ Updated logging settings for guild ${guildId}`);

    return c.json(
      {
        success: true,
        guild: updatedGuild,
        message: 'Logging settings updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error updating logging:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});
