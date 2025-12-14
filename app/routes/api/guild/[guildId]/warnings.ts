import type { Context } from 'hono';
import { GuildManager } from '@/lib/database/mongoose';
import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('guildId');
    const body = (await c.req.json().catch(() => ({}))) as any;
    const { max_warn } = body;

    if (!guildId || !max_warn) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateGuild(guildId, { max_warn });

    if (!updatedGuild) {
      return c.json({ error: 'Guild not found' }, 404);
    }

    console.log(`✅ Updated warnings settings for guild ${guildId}`);

    return c.json(
      {
        success: true,
        guild: updatedGuild,
        message: 'Warning settings updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error updating warnings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});
