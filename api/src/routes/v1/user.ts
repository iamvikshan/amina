/**
 * User API Routes
 *
 * Endpoints for retrieving authenticated user data for the dashboard
 */

import { Hono } from 'hono';
import { requireApiKey } from '../../middleware/auth';
import { success, errors } from '../../lib/response';
import { createMongoClient } from '../../lib/mongodb';
import { createLogger } from '../../lib/logger';

const user = new Hono<{ Bindings: Env }>();

// All user routes require authentication
user.use('*', requireApiKey);

/**
 * GET /v1/user/header-data
 *
 * Returns user data needed for the dashboard header component
 * - User profile (Discord info)
 * - Guardian rank & XP
 * - Achievements count
 * - Guild memberships (limited to 5)
 */
user.get('/header-data', async (c) => {
  const logger = createLogger(c);
  const userId = c.get('userId');

  if (!userId) {
    return errors.unauthorized(c, 'User not authenticated');
  }

  const db = createMongoClient(c.env);
  if (!db) {
    logger.error('MongoDB not configured', undefined, {
      endpoint: '/v1/user/header-data',
      userId,
    });
    return errors.internal(c, 'Database unavailable');
  }

  try {
    // Fetch user data from MongoDB
    const userData = await db.findOne(
      'users',
      { _id: userId },
      {
        projection: {
          discordId: 1,
          username: 1,
          discriminator: 1,
          avatar: 1,
          xp: 1,
          level: 1,
          guardianRank: 1,
          achievements: 1,
          guilds: 1,
          premium: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    if (!userData) {
      logger.warn('User not found in database', {
        userId,
        endpoint: '/v1/user/header-data',
      });
      return errors.notFound(c, 'User not found');
    }

    // Calculate achievements count
    const achievementsCount = userData.achievements?.length || 0;

    // Limit guilds to 5 for header display
    const guilds = (userData.guilds || []).slice(0, 5).map((guild: any) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.owner || false,
    }));

    // Format response
    const response = {
      user: {
        id: userData.discordId,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        avatarUrl: userData.avatar
          ? `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`,
      },
      stats: {
        xp: userData.xp || 0,
        level: userData.level || 0,
        guardianRank: userData.guardianRank || 'Initiate',
        achievements: achievementsCount,
      },
      guilds,
      premium: userData.premium || false,
      timestamps: {
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    };

    logger.info('User header data retrieved', {
      userId,
      username: userData.username,
      guildsCount: guilds.length,
    });

    return success(c, response);
  } catch (error) {
    logger.error(
      'Failed to fetch user header data',
      error instanceof Error ? error : undefined,
      {
        userId,
        endpoint: '/v1/user/header-data',
      }
    );
    return errors.internal(c, 'Failed to retrieve user data');
  }
});

/**
 * GET /v1/user/profile
 *
 * Returns complete user profile data
 */
user.get('/profile', async (c) => {
  const logger = createLogger(c);
  const userId = c.get('userId');

  if (!userId) {
    return errors.unauthorized(c, 'User not authenticated');
  }

  const db = createMongoClient(c.env);
  if (!db) {
    logger.error('MongoDB not configured', undefined, {
      endpoint: '/v1/user/profile',
      userId,
    });
    return errors.internal(c, 'Database unavailable');
  }

  try {
    const userData = await db.findOne('users', { _id: userId });

    if (!userData) {
      return errors.notFound(c, 'User not found');
    }

    // Remove sensitive fields
    delete userData.apiKeys;

    logger.info('User profile retrieved', {
      userId,
      username: userData.username,
    });

    return success(c, userData);
  } catch (error) {
    logger.error(
      'Failed to fetch user profile',
      error instanceof Error ? error : undefined,
      {
        userId,
        endpoint: '/v1/user/profile',
      }
    );
    return errors.internal(c, 'Failed to retrieve user profile');
  }
});

/**
 * GET /v1/user/guilds
 *
 * Returns all guilds the user is a member of
 */
user.get('/guilds', async (c) => {
  const logger = createLogger(c);
  const userId = c.get('userId');

  if (!userId) {
    return errors.unauthorized(c, 'User not authenticated');
  }

  const db = createMongoClient(c.env);
  if (!db) {
    logger.error('MongoDB not configured', undefined, {
      endpoint: '/v1/user/guilds',
      userId,
    });
    return errors.internal(c, 'Database unavailable');
  }

  try {
    const userData = await db.findOne(
      'users',
      { _id: userId },
      { projection: { guilds: 1 } }
    );

    if (!userData) {
      return errors.notFound(c, 'User not found');
    }

    const guilds = (userData.guilds || []).map((guild: any) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      iconUrl: guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=128`
        : null,
      owner: guild.owner || false,
      permissions: guild.permissions,
    }));

    logger.info('User guilds retrieved', {
      userId,
      guildsCount: guilds.length,
    });

    return success(c, { guilds });
  } catch (error) {
    logger.error(
      'Failed to fetch user guilds',
      error instanceof Error ? error : undefined,
      {
        userId,
        endpoint: '/v1/user/guilds',
      }
    );
    return errors.internal(c, 'Failed to retrieve user guilds');
  }
});

/**
 * GET /v1/user/achievements
 *
 * Returns user's achievements
 */
user.get('/achievements', async (c) => {
  const logger = createLogger(c);
  const userId = c.get('userId');

  if (!userId) {
    return errors.unauthorized(c, 'User not authenticated');
  }

  const db = createMongoClient(c.env);
  if (!db) {
    logger.error('MongoDB not configured', undefined, {
      endpoint: '/v1/user/achievements',
      userId,
    });
    return errors.internal(c, 'Database unavailable');
  }

  try {
    const userData = await db.findOne(
      'users',
      { _id: userId },
      { projection: { achievements: 1 } }
    );

    if (!userData) {
      return errors.notFound(c, 'User not found');
    }

    logger.info('User achievements retrieved', {
      userId,
      achievementsCount: userData.achievements?.length || 0,
    });

    return success(c, {
      achievements: userData.achievements || [],
      count: userData.achievements?.length || 0,
    });
  } catch (error) {
    logger.error(
      'Failed to fetch user achievements',
      error instanceof Error ? error : undefined,
      {
        userId,
        endpoint: '/v1/user/achievements',
      }
    );
    return errors.internal(c, 'Failed to retrieve user achievements');
  }
});

export default user;
