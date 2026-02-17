/**
 * Internal Bot Routes
 *
 * Endpoints for bot registration, heartbeat, and stats push
 */

import { Hono } from 'hono';
import {
  botAuthMiddleware,
  getBotClientSecret,
} from '../../middleware/botAuth';
import { registerBot, deregisterBot } from '../../lib/botAuth';
import { createLogger } from '../../lib/logger';
import {
  getBotMeta,
  updateBotMeta,
  updateBotHeartbeat,
  pushBotStats,
  updateBotCommands,
} from '../../lib/kvBots';
import { success, errors } from '../../lib/response';

const bots = new Hono<{ Bindings: Env; Variables: BotAuthContext }>();

/**
 * POST /internal/bots/register
 * Register a new bot or update existing registration
 * No auth required - credentials are verified against Discord
 */
bots.post('/register', async (c) => {
  const kv = c.env.BOTS;

  if (!kv) {
    return errors.internal(c, 'Bot registration unavailable');
  }

  try {
    const payload = await c.req.json<BotRegisterPayload>();

    // Validate required fields
    if (!payload.clientId || !payload.clientSecret) {
      return errors.badRequest(c, 'clientId and clientSecret are required');
    }

    if (!payload.ownerId) {
      return errors.badRequest(c, 'ownerId is required');
    }

    if (!payload.version) {
      return errors.badRequest(c, 'version is required');
    }

    const result = await registerBot(kv, payload);

    if (!result.success) {
      return errors.unauthorized(c, result.error || 'Registration failed');
    }

    // Return bot metadata (without auth info)
    const meta = await getBotMeta(kv, payload.clientId);

    return success(c, {
      message: 'Bot registered successfully',
      bot: meta,
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Bot registration failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/internal/bots/register',
      }
    );
    return errors.internal(c, 'Registration failed');
  }
});

/**
 * Bot Authentication Middleware
 * Applied only to routes matching '/:clientId/*' pattern
 *
 * The '/register' endpoint (and other top-level routes) are intentionally
 * unauthenticated to allow new bots to register. All routes under
 * '/:clientId/*' require valid bot authentication via botAuthMiddleware.
 */
bots.use('/:clientId/*', botAuthMiddleware);

/**
 * DELETE /internal/bots/:clientId
 * Deregister a bot
 */
bots.delete('/:clientId', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');
  const authenticatedClientId = c.get('botClientId');

  // Ensure bot can only deregister itself
  if (clientId !== authenticatedClientId) {
    return errors.forbidden(c, 'Cannot deregister other bots');
  }

  if (!kv) {
    return errors.internal(c, 'Bot storage unavailable');
  }

  const clientSecret = getBotClientSecret(c);
  const logger = createLogger(c);

  if (!clientSecret) {
    return errors.unauthorized(c, 'Bot authentication required');
  }

  const result = await deregisterBot(kv, clientId, clientSecret, logger);

  if (!result.success) {
    return errors.badRequest(c, result.error || 'Deregistration failed');
  }

  return success(c, { message: 'Bot deregistered successfully' });
});

/**
 * POST /internal/bots/:clientId/heartbeat
 * Update bot's lastSeen timestamp
 */
bots.post('/:clientId/heartbeat', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');
  const authenticatedClientId = c.get('botClientId');

  if (clientId !== authenticatedClientId) {
    return errors.forbidden(c, 'Cannot send heartbeat for other bots');
  }

  if (!kv) {
    return errors.internal(c, 'Bot storage unavailable');
  }

  try {
    await updateBotHeartbeat(kv, clientId);
    return success(c, {
      message: 'Heartbeat received',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Bot heartbeat failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/internal/bots/:clientId/heartbeat',
        clientId,
      }
    );
    return errors.internal(c, 'Heartbeat failed');
  }
});

/**
 * POST /internal/bots/:clientId/stats
 * Push current bot statistics
 */
bots.post('/:clientId/stats', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');
  const authenticatedClientId = c.get('botClientId');

  if (clientId !== authenticatedClientId) {
    return errors.forbidden(c, 'Cannot push stats for other bots');
  }

  if (!kv) {
    return errors.internal(c, 'Bot storage unavailable');
  }

  try {
    const stats = await c.req.json<BotStatsPushPayload>();

    const requiredFields = [
      'guilds',
      'members',
      'channels',
      'commands',
      'ping',
      'uptime',
    ];
    const invalidFields = requiredFields.filter((field) => {
      const value = (stats as any)[field];
      return typeof value !== 'number' || !Number.isFinite(value);
    });

    if (invalidFields.length > 0) {
      return errors.badRequest(
        c,
        `${invalidFields.join(', ')} must be a finite number`
      );
    }

    await pushBotStats(kv, clientId, stats);

    return success(c, {
      message: 'Stats updated',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Bot stats push failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/internal/bots/:clientId/stats',
        clientId,
      }
    );
    return errors.internal(c, 'Stats push failed');
  }
});

/**
 * PUT /internal/bots/:clientId
 * Update bot metadata
 */
bots.put('/:clientId', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');
  const authenticatedClientId = c.get('botClientId');

  if (clientId !== authenticatedClientId) {
    return errors.forbidden(c, 'Cannot update other bots');
  }

  if (!kv) {
    return errors.internal(c, 'Bot storage unavailable');
  }

  try {
    const updates = await c.req.json<
      Partial<{
        name: string;
        version: string;
        inviteUrl: string;
        supportServer: string;
        website: string;
        isPublic: boolean;
        features: string[];
      }>
    >();

    // Prevent updating protected fields
    delete (updates as Record<string, unknown>).clientId;
    delete (updates as Record<string, unknown>).ownerId;
    delete (updates as Record<string, unknown>).registeredAt;

    await updateBotMeta(kv, clientId, updates);

    const updated = await getBotMeta(kv, clientId);
    return success(c, { bot: updated });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Bot metadata update failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: 'PUT /internal/bots/:clientId',
        clientId,
      }
    );
    return errors.internal(c, 'Update failed');
  }
});

/**
 * POST /internal/bots/:clientId/commands
 * Update bot command list
 */
bots.post('/:clientId/commands', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');
  const authenticatedClientId = c.get('botClientId');

  if (clientId !== authenticatedClientId) {
    return errors.forbidden(c, 'Cannot update commands for other bots');
  }

  if (!kv) {
    return errors.internal(c, 'Bot storage unavailable');
  }

  try {
    const { commands } = await c.req.json<{ commands: BotCommand[] }>();

    if (!Array.isArray(commands)) {
      return errors.badRequest(c, 'commands must be an array');
    }

    await updateBotCommands(kv, clientId, commands);

    return success(c, {
      message: 'Commands updated',
      count: commands.length,
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Bot commands update failed',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/internal/bots/:clientId/commands',
        clientId,
      }
    );
    return errors.internal(c, 'Commands update failed');
  }
});

export default bots;
