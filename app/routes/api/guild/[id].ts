import type { Context } from 'hono';
import { GuildManager } from '@/lib/database/mongoose';
import { createResponse, createErrorResponse } from '@/lib/api-response';
import { createRoute } from 'honox/factory';

export const GET = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('id');
    if (!guildId) {
      return createErrorResponse('Guild ID is required', 400);
    }

    const guildManager = await GuildManager.getInstance();
    const guild = await guildManager.getGuild(guildId);

    if (!guild) {
      return createErrorResponse('Guild not found', 404);
    }

    return createResponse(guild);
  } catch (error) {
    console.error('Error handling guild request:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

export const PATCH = createRoute(async (c: Context) => {
  try {
    const guildId = c.req.param('id');
    if (!guildId) {
      return createErrorResponse('Guild ID is required', 400);
    }

    const updateData = await c.req.json().catch(() => null);
    if (!updateData || typeof updateData !== 'object') {
      return createErrorResponse('Invalid request body', 400);
    }

    const guildManager = await GuildManager.getInstance();

    let updatedGuild;
    switch ((updateData as any).type) {
      case 'automod':
        updatedGuild = await guildManager.updateAutomod(
          guildId,
          (updateData as any).settings
        );
        break;
      case 'welcome':
        updatedGuild = await guildManager.updateWelcome(
          guildId,
          (updateData as any).settings
        );
        break;
      case 'ticket':
        updatedGuild = await guildManager.updateTicket(
          guildId,
          (updateData as any).settings
        );
        break;
      case 'logs':
        updatedGuild = await guildManager.updateLogs(
          guildId,
          (updateData as any).settings
        );
        break;
      default:
        updatedGuild = await guildManager.updateGuild(
          guildId,
          updateData as any
        );
    }

    if (!updatedGuild) {
      return createErrorResponse('Failed to update guild', 500);
    }

    return createResponse(updatedGuild);
  } catch (error) {
    console.error('Error updating guild:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
