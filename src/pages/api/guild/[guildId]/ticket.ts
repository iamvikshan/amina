// API endpoint for updating ticket settings
import type { APIRoute } from 'astro';
import { GuildManager } from '@/lib/database/mongoose';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { guildId } = params;
    const body = await request.json();
    const { ticket } = body;

    if (!guildId || !ticket) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const guildManager = await GuildManager.getInstance();
    const updatedGuild = await guildManager.updateTicket(guildId, ticket);

    if (!updatedGuild) {
      return new Response(JSON.stringify({ error: 'Guild not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Updated ticket settings for guild ${guildId}`);

    return new Response(
      JSON.stringify({
        success: true,
        guild: updatedGuild,
        message: 'Ticket settings updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating ticket:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
