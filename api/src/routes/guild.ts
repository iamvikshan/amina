import { Hono } from 'hono';
import { success, errors } from '../lib/response';
import { createLogger } from '../lib/logger';
import { GuildSettings } from '../../types/database';

const guild = new Hono<{ Bindings: Env }>();

/**
 * GET /guild/:id
 * Get guild settings by ID
 *
 * Note: In Cloudflare Workers, we can't use MongoDB directly.
 * Options:
 * 1. Proxy to your Astro backend (which has MongoDB)
 * 2. Use Cloudflare D1 as the database
 * 3. Use an external API that wraps MongoDB (like MongoDB Atlas Data API)
 *
 * For now, this is a placeholder that you can implement based on your needs.
 */
guild.get('/:id', async (c) => {
  const guildId = c.req.param('id');

  if (!guildId) {
    return errors.badRequest(c, 'Guild ID is required');
  }

  // Validate Discord snowflake format (17-19 digit number)
  if (!/^\d{17,19}$/.test(guildId)) {
    return errors.badRequest(c, 'Invalid guild ID format');
  }

  try {
    // TODO: Implement database lookup
    // Option 1: Proxy to Astro backend
    // const response = await fetch(`${env.ASTRO_BACKEND_URL}/api/guild/${guildId}`);
    // const data = await response.json();

    // Option 2: Use MongoDB Atlas Data API
    // const response = await fetch(`${env.MONGODB_DATA_API_URL}/action/findOne`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'api-key': env.MONGODB_API_KEY,
    //   },
    //   body: JSON.stringify({
    //     dataSource: 'Cluster0',
    //     database: 'amina',
    //     collection: 'guilds',
    //     filter: { guildId },
    //   }),
    // });

    // Placeholder response
    return errors.notFound(c, 'Guild not found or database not configured');
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to fetch guild data',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/guild/:id',
        guildId,
      }
    );
    return errors.internal(c, 'Failed to fetch guild data');
  }
});

/**
 * PATCH /guild/:id
 * Update guild settings
 */
guild.patch('/:id', async (c) => {
  const guildId = c.req.param('id');

  if (!guildId) {
    return errors.badRequest(c, 'Guild ID is required');
  }

  if (!/^\d{17,19}$/.test(guildId)) {
    return errors.badRequest(c, 'Invalid guild ID format');
  }

  try {
    const body = await c.req.json<
      Partial<GuildSettings> & { type?: string; settings?: unknown }
    >();

    if (!body || Object.keys(body).length === 0) {
      return errors.badRequest(c, 'Update data is required');
    }

    // TODO: Implement database update
    // This would need authentication/authorization middleware

    return errors.notFound(
      c,
      'Guild update not implemented - database not configured'
    );
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to update guild data',
      error instanceof Error ? error : undefined,
      {
        endpoint: 'PATCH /guild/:id',
        guildId,
      }
    );
    return errors.internal(c, 'Failed to update guild data');
  }
});

/**
 * POST /guild/:id/refresh
 * Trigger a guild data refresh
 */
guild.post('/:id/refresh', async (c) => {
  const guildId = c.req.param('id');

  if (!guildId) {
    return errors.badRequest(c, 'Guild ID is required');
  }

  if (!/^\d{17,19}$/.test(guildId)) {
    return errors.badRequest(c, 'Invalid guild ID format');
  }

  try {
    // TODO: Implement refresh logic
    // This would invalidate caches and potentially sync with Discord API

    return success(c, {
      message: 'Refresh triggered',
      guildId,
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to refresh guild data',
      error instanceof Error ? error : undefined,
      {
        endpoint: 'POST /guild/:id/refresh',
        guildId,
      }
    );
    return errors.internal(c, 'Failed to refresh guild data');
  }
});

export default guild;
