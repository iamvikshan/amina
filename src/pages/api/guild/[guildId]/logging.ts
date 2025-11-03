// API endpoint for updating logging settings
import type { APIRoute } from 'astro';
import { GuildManager } from '@/lib/database/mongoose';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { guildId } = params;
    const body = await request.json();
    const { logs } = body;

    if (!guildId || !logs) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateLogs(guildId, logs);

    if (!updatedGuild) {
      return new Response(JSON.stringify({ error: 'Guild not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Updated logging settings for guild ${guildId}`);

    return new Response(
      JSON.stringify({
        success: true,
        guild: updatedGuild,
        message: 'Logging settings updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating logging:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
