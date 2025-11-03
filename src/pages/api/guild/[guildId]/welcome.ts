// API endpoint for updating welcome settings
import type { APIRoute } from 'astro';
import { GuildManager } from '@/lib/database/mongoose';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { guildId } = params;
    const body = await request.json();
    const { welcome } = body;

    if (!guildId || !welcome) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateWelcome(guildId, welcome);

    if (!updatedGuild) {
      return new Response(JSON.stringify({ error: 'Guild not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Updated welcome settings for guild ${guildId}`);

    return new Response(
      JSON.stringify({
        success: true,
        guild: updatedGuild,
        message: 'Welcome settings updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating welcome:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
