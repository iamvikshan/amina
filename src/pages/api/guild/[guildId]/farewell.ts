// API endpoint for updating farewell settings
import type { APIRoute } from 'astro';
import { GuildManager } from '@/lib/database/mongoose';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { guildId } = params;
    const body = await request.json();
    const { farewell } = body;

    if (!guildId || !farewell) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const guildManager = await GuildManager.getInstance();
    const currentGuild = await guildManager.getGuild(guildId);

    if (!currentGuild) {
      return new Response(JSON.stringify({ error: 'Guild not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedGuild = await guildManager.updateGuild(guildId, { farewell });

    console.log(`✅ Updated farewell settings for guild ${guildId}`);

    return new Response(
      JSON.stringify({
        success: true,
        guild: updatedGuild,
        message: 'Farewell settings updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating farewell:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
