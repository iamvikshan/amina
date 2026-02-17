/**
 * V1 Images API Routes
 *
 * All image generation endpoints with API key authentication.
 */

import { Hono } from 'hono';
import { requireApiKey, requirePermission } from '../../middleware/auth';
import { errors } from '../../lib/response';
import { createLogger } from '../../lib/logger';
import { generateRankCard } from '../../lib/cards/rank-card';
import { generateWelcomeCard } from '../../lib/cards/welcome-card';
import { generateSpotifyCard } from '../../lib/cards/spotify-card';

const images = new Hono<{ Bindings: Env }>();

// Apply API key authentication to all routes
images.use('*', requireApiKey);
images.use('*', requirePermission('images'));

/**
 * GET /v1/images/rank-card
 * Generate a rank card image
 */
images.get('/rank-card', async (c) => {
  const query = c.req.query();

  // Validate required params
  const username = query.username;
  const level = parseInt(query.level || '0', 10);
  const xp = parseInt(query.xp || '0', 10);
  const requiredXp = parseInt(
    query.requiredXp || query.required_xp || '100',
    10
  );
  const rank = parseInt(query.rank || '1', 10);

  if (!username) {
    return errors.badRequest(c, 'Missing required parameter: username');
  }

  try {
    const svg = generateRankCard({
      username,
      level,
      xp,
      requiredXp,
      rank,
      avatar: query.avatar,
      discriminator: query.discriminator,
      status: query.status as 'online' | 'idle' | 'dnd' | 'offline' | undefined,
      background: query.background,
      progressColor: query.progressColor || query.progress_color,
      textColor: query.textColor || query.text_color,
      theme: query.theme as 'dark' | 'light' | 'amina' | undefined,
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate rank card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/rank-card',
      }
    );
    return errors.internal(c, 'Failed to generate rank card');
  }
});

/**
 * GET /v1/images/welcome-card
 * Generate a welcome card image
 */
images.get('/welcome-card', async (c) => {
  const query = c.req.query();

  const username = query.username;
  const memberCount = parseInt(
    query.memberCount || query.member_count || '0',
    10
  );
  const guildName = query.guildName || query.guild_name || 'Server';

  if (!username) {
    return errors.badRequest(c, 'Missing required parameter: username');
  }

  try {
    const svg = generateWelcomeCard({
      username,
      memberCount,
      guildName,
      avatar: query.avatar,
      type: 'welcome',
      message: query.message,
      background: query.background,
      accentColor: query.accentColor || query.accent_color,
      textColor: query.textColor || query.text_color,
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate welcome card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/welcome-card',
      }
    );
    return errors.internal(c, 'Failed to generate welcome card');
  }
});

/**
 * GET /v1/images/farewell-card
 * Generate a farewell card image
 */
images.get('/farewell-card', async (c) => {
  const query = c.req.query();

  const username = query.username;
  const memberCount = parseInt(
    query.memberCount || query.member_count || '0',
    10
  );
  const guildName = query.guildName || query.guild_name || 'Server';

  if (!username) {
    return errors.badRequest(c, 'Missing required parameter: username');
  }

  try {
    const svg = generateWelcomeCard({
      username,
      memberCount,
      guildName,
      avatar: query.avatar,
      type: 'farewell',
      message: query.message,
      background: query.background,
      accentColor: query.accentColor || query.accent_color || '#ed4245',
      textColor: query.textColor || query.text_color,
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate farewell card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/farewell-card',
      }
    );
    return errors.internal(c, 'Failed to generate farewell card');
  }
});

/**
 * GET /v1/images/spotify-card
 * Generate a Spotify "Now Playing" card
 */
images.get('/spotify-card', async (c) => {
  const query = c.req.query();

  const title = query.title;
  const artist = query.artist;

  if (!title || !artist) {
    return errors.badRequest(c, 'Missing required parameters: title, artist');
  }

  try {
    const svg = generateSpotifyCard({
      title,
      artist,
      album: query.album,
      albumArt: query.albumArt || query.album_art,
      progress: query.progress ? parseFloat(query.progress) : undefined,
      duration: query.duration,
      currentTime: query.currentTime || query.current_time,
      isPlaying: query.isPlaying === 'true' || query.is_playing === 'true',
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate Spotify card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/v1/images/spotify-card',
      }
    );
    return errors.internal(c, 'Failed to generate Spotify card');
  }
});

/**
 * GET /v1/images/color
 * Generate a solid color image
 */
images.get('/color', async (c) => {
  const hex = c.req.query('hex') || c.req.query('color') || 'DC143C';
  const width = parseInt(c.req.query('width') || '256', 10);
  const height = parseInt(c.req.query('height') || '256', 10);

  // Validate hex color
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return errors.badRequest(c, 'Invalid hex color. Use format: RRGGBB');
  }

  // Clamp dimensions
  const w = Math.min(Math.max(width, 1), 1024);
  const h = Math.min(Math.max(height, 1), 1024);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#${cleanHex}"/>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

/**
 * GET /v1/images/circle
 * Circle crop an image
 */
images.get('/circle', async (c) => {
  const imageUrl = c.req.query('image') || c.req.query('url');
  const size = parseInt(c.req.query('size') || '256', 10);

  if (!imageUrl) {
    return errors.badRequest(c, 'Missing required parameter: image');
  }

  // Clamp size
  const s = Math.min(Math.max(size, 16), 1024);
  const r = s / 2;

  const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <clipPath id="circle">
        <circle cx="${r}" cy="${r}" r="${r}"/>
      </clipPath>
    </defs>
    <image xlink:href="${imageUrl}" width="${s}" height="${s}" clip-path="url(#circle)" preserveAspectRatio="xMidYMid slice"/>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

export default images;
