/**
 * Public Bot Routes (v1)
 *
 * Public endpoints for querying registered bot information
 */

import { Hono } from 'hono';
import { createLogger } from '../../lib/logger';
import {
  getBotInfo,
  getBotMeta,
  getBotStats,
  getBotCommands,
  listBots,
  isBotOnline,
  getBotAvatarUrl,
} from '../../lib/kvBots';
import { success, errors } from '../../lib/response';

/**
 * Batch size for concurrent KV operations
 * Balances concurrent requests vs memory overhead and KV namespace load
 */
const KV_BATCH_SIZE = 10;

// Interface for the bot response in the list endpoint
interface BotWithStatus {
  clientId: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  features?: string[];
  inviteUrl?: string;
  supportServer?: string;
  website?: string;
}

const bots = new Hono<{ Bindings: Env }>();

/**
 * GET /v1/bots
 * List all public bots with pagination
 * Query params:
 * - page: Page number (1-indexed, default: 1)
 * - limit: Items per page (1-100, default: 20)
 */
bots.get('/', async (c) => {
  const kv = c.env.BOTS;

  if (!kv) {
    return errors.internal(c, 'Bot data unavailable');
  }

  try {
    // Parse and validate pagination parameters
    const pageParam = c.req.query('page');
    const limitParam = c.req.query('limit');

    const parsedPage = parseInt(pageParam ?? '1', 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

    const parsedLimit = parseInt(limitParam ?? '20', 10);
    const limit = Number.isNaN(parsedLimit)
      ? 20
      : Math.min(100, Math.max(1, parsedLimit));

    const botList = await listBots(kv, { publicOnly: true });
    const totalBots = botList.length;
    const totalPages = Math.ceil(totalBots / limit);

    // Calculate pagination boundaries
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalBots);

    // Return empty results if page is out of bounds
    if (startIndex >= totalBots && totalBots > 0) {
      return success(c, {
        bots: [],
        total: totalBots,
        page,
        limit,
        pages: totalPages,
        hasMore: false,
      });
    }

    // Slice the bot list for the current page
    const paginatedBots = botList.slice(startIndex, endIndex);

    // Process bots in batches to avoid overwhelming the KV namespace
    const botsWithStatus: BotWithStatus[] = [];

    for (let i = 0; i < paginatedBots.length; i += KV_BATCH_SIZE) {
      const batch = paginatedBots.slice(i, i + KV_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (bot) => {
          try {
            return {
              clientId: bot.clientId,
              name: bot.name,
              avatar: getBotAvatarUrl(bot.clientId, bot.avatar),
              isOnline: await isBotOnline(kv, bot.clientId),
              features: bot.features,
              inviteUrl: bot.inviteUrl,
              supportServer: bot.supportServer,
              website: bot.website,
            };
          } catch (err) {
            const logger = createLogger(c);
            logger.warn('Failed to check bot online status', {
              endpoint: '/v1/bots',
              botClientId: bot.clientId,
              error: err instanceof Error ? err.message : String(err),
            });
            return {
              clientId: bot.clientId,
              name: bot.name,
              avatar: getBotAvatarUrl(bot.clientId, bot.avatar),
              isOnline: false, // Default to offline on error
              features: bot.features,
              inviteUrl: bot.inviteUrl,
              supportServer: bot.supportServer,
              website: bot.website,
            };
          }
        })
      );
      botsWithStatus.push(...batchResults);
    }

    return success(c, {
      bots: botsWithStatus,
      total: totalBots,
      page,
      limit,
      pages: totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to list bots',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/v1/bots',
      }
    );
    return errors.internal(c, 'Failed to list bots');
  }
});

/**
 * GET /v1/bots/:clientId
 * Get bot information by client ID
 */
bots.get('/:clientId', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');

  if (!kv) {
    return errors.internal(c, 'Bot data unavailable');
  }

  try {
    const info = await getBotInfo(kv, clientId);

    if (!info) {
      return errors.notFound(c, 'Bot not found');
    }

    // Only return public bot information
    // Non-public bots are inaccessible to unauthenticated requesters
    // Owner access for private bots is handled by separate authenticated endpoints
    if (!info.meta.isPublic) {
      return errors.notFound(c, 'Bot not found');
    }

    const isOnline = await isBotOnline(kv, clientId);

    return success(c, {
      bot: {
        clientId: info.meta.clientId,
        name: info.meta.name,
        avatar: getBotAvatarUrl(info.meta.clientId, info.meta.avatar),
        isOnline,
        version: info.meta.version,
        features: info.meta.features,
        inviteUrl: info.meta.inviteUrl,
        supportServer: info.meta.supportServer,
        website: info.meta.website,
        stats: info.stats
          ? {
              guilds: info.stats.guilds,
              members: info.stats.members,
              commands: info.stats.commands,
              uptime: info.stats.uptime,
              ping: info.stats.ping,
              status: info.stats.status,
              lastUpdated: info.stats.lastUpdated,
            }
          : null,
      },
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to get bot info',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/v1/bots/:clientId',
        clientId,
      }
    );
    return errors.internal(c, 'Failed to get bot info');
  }
});

/**
 * GET /v1/bots/:clientId/stats
 * Get bot statistics only
 */
bots.get('/:clientId/stats', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');

  if (!kv) {
    return errors.internal(c, 'Bot data unavailable');
  }

  try {
    const meta = await getBotMeta(kv, clientId);

    if (!meta || !meta.isPublic) {
      return errors.notFound(c, 'Bot not found');
    }

    const stats = await getBotStats(kv, clientId);

    if (!stats) {
      return success(c, {
        stats: {
          guilds: 0,
          members: 0,
          channels: 0,
          commands: 0,
          ping: 0,
          uptime: 0,
          memoryUsage: 0,
          status: 'offline',
          lastUpdated: null,
          hasStats: false,
        },
      });
    }

    return success(c, {
      stats,
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to get bot stats',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/v1/bots/:clientId/stats',
        clientId,
      }
    );
    return errors.internal(c, 'Failed to get stats');
  }
});

/**
 * GET /v1/bots/:clientId/commands
 * Get bot command list
 */
bots.get('/:clientId/commands', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');

  if (!kv) {
    return errors.internal(c, 'Bot data unavailable');
  }

  try {
    const meta = await getBotMeta(kv, clientId);

    if (!meta || !meta.isPublic) {
      return errors.notFound(c, 'Bot not found');
    }

    const commands = await getBotCommands(kv, clientId);

    if (!commands) {
      return success(c, {
        commands: [],
        categories: [],
        totalCommands: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    return success(c, commands);
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to get bot commands',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/v1/bots/:clientId/commands',
        clientId,
      }
    );
    return errors.internal(c, 'Failed to get commands');
  }
});

/**
 * GET /v1/bots/:clientId/status
 * Quick online status check
 */
bots.get('/:clientId/status', async (c) => {
  const kv = c.env.BOTS;
  const clientId = c.req.param('clientId');

  if (!kv) {
    return errors.internal(c, 'Bot data unavailable');
  }

  try {
    const [meta, stats] = await Promise.all([
      getBotMeta(kv, clientId),
      getBotStats(kv, clientId),
    ]);

    if (!meta || !meta.isPublic) {
      return errors.notFound(c, 'Bot not found');
    }

    // Check online status locally to avoid redundant KV fetch
    let isOnline = false;
    if (meta.lastSeen) {
      const lastSeenTime = new Date(meta.lastSeen).getTime();
      if (!isNaN(lastSeenTime)) {
        isOnline = Date.now() - lastSeenTime < 120000; // 2 minutes
      }
    }

    return success(c, {
      online: isOnline,
      lastSeen: meta.lastSeen,
    });
  } catch (err) {
    const logger = createLogger(c);
    logger.error(
      'Failed to get bot status',
      err instanceof Error ? err : undefined,
      {
        endpoint: '/v1/bots/:clientId/status',
        clientId,
      }
    );
    return errors.internal(c, 'Failed to get status');
  }
});

export default bots;
