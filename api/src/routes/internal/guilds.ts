/**
 * Internal Guild Routes
 *
 * Endpoints for syncing guild settings from bot to API storage
 */

import { Hono } from 'hono';
import { createMongoClient } from '../../lib/mongodb';
import { success, errors } from '../../lib/response';
import { createLogger } from '../../lib/logger';
import { GuildSettings } from '../../../types/database';

// Maximum allowed payload size for guild settings sync (100 KB)
const MAX_PAYLOAD_BYTES = 100 * 1024;

const guilds = new Hono<{ Bindings: Env; Variables: BotAuthContext }>();

/**
 * POST /internal/guilds/:guildId/settings
 * Sync guild settings from bot to API storage
 */
guilds.post('/:guildId/settings', async (c) => {
  const guildId = c.req.param('guildId');
  const botClientId = c.get('botClientId');

  const db = createMongoClient(c.env);

  if (!db) {
    return errors.internal(c, 'Database unavailable');
  }

  try {
    const contentLength = c.req.header('content-length');
    if (contentLength) {
      const trimmedHeader = contentLength.trim();
      const parsedLength = parseInt(trimmedHeader, 10);

      if (isNaN(parsedLength) || parsedLength < 0) {
        return errors.badRequest(c, 'Invalid Content-Length header');
      }

      if (parsedLength > MAX_PAYLOAD_BYTES) {
        return errors.badRequest(c, 'Payload too large');
      }
    }

    let settings: Partial<GuildSettings>;
    try {
      settings = await c.req.json();
    } catch {
      return errors.badRequest(c, 'Invalid JSON');
    }

    // Double check size against MAX_PAYLOAD_BYTES
    if (JSON.stringify(settings).length > MAX_PAYLOAD_BYTES) {
      return errors.badRequest(c, 'Payload too large');
    }

    // Whitelist allowed fields
    const allowedKeys: (keyof GuildSettings)[] = [
      'prefix',
      'automod',
      'welcome',
      'ticket',
      'logs',
    ];

    const filteredSettings: Partial<GuildSettings> = {};
    for (const key of allowedKeys) {
      if (key in settings && settings[key] !== undefined) {
        (filteredSettings as any)[key] = settings[key];
      }
    }

    await db.updateOne(
      'guild_settings',
      { guildId, botClientId },
      {
        $set: {
          ...filteredSettings,
          guildId,
          botClientId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return success(c, { message: 'Settings synced' });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Guild settings sync failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: 'POST /internal/guilds/:guildId/settings',
        guildId,
      }
    );
    return errors.internal(c, 'Sync failed');
  }
});

/**
 * GET /internal/guilds/:guildId/settings
 * Retrieve guild settings
 */
guilds.get('/:guildId/settings', async (c) => {
  const guildId = c.req.param('guildId');
  const botClientId = c.get('botClientId');

  const db = createMongoClient(c.env);

  if (!db) {
    return errors.internal(c, 'Database unavailable');
  }

  try {
    const settings = await db.findOne<GuildSettings>('guild_settings', {
      guildId,
      botClientId,
    });

    if (!settings) {
      return success(c, { settings: null });
    }

    return success(c, { settings });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to retrieve guild settings',
      err instanceof Error ? err : undefined,
      {
        endpoint: 'GET /internal/guilds/:guildId/settings',
        guildId,
      }
    );
    return errors.internal(c, 'Failed to retrieve settings');
  }
});

export default guilds;
