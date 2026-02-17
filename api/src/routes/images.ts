import { Hono } from 'hono';
import { errors } from '../lib/response';
import { createLogger } from '../lib/logger';

const images = new Hono<{ Bindings: Env }>();

/**
 * GET /images/rank-card
 * Generate a rank card image for a user
 *
 * Query params:
 * - userId: Discord user ID
 * - guildId: Guild ID for guild-specific rank
 * - username: Display name
 * - discriminator: Discord discriminator (legacy)
 * - avatar: Avatar URL or hash
 * - level: Current level
 * - xp: Current XP
 * - requiredXp: XP needed for next level
 * - rank: Leaderboard position
 * - background?: Custom background URL or color
 * - theme?: Card theme (dark, light, custom)
 */
images.get('/rank-card', async (c) => {
  const query = c.req.query();

  // Validate required params
  const required = ['userId', 'username', 'level', 'xp', 'requiredXp', 'rank'];
  const missing = required.filter((key) => !query[key]);

  if (missing.length > 0) {
    return errors.badRequest(
      c,
      `Missing required parameters: ${missing.join(', ')}`
    );
  }

  try {
    // TODO: Implement rank card generation
    // Options:
    // 1. Use @vercel/og or similar for SVG-based generation
    // 2. Use Cloudflare's HTMLRewriter with SVG templates
    // 3. Use canvas-based generation (might need a separate service)
    // 4. Generate SVG directly and return as image

    // For now, return a placeholder SVG
    const { username, level, xp, requiredXp, rank } = query;
    const progress = Math.min(100, (Number(xp) / Number(requiredXp)) * 100);

    const svg = `
      <svg width="934" height="282" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e"/>
            <stop offset="100%" style="stop-color:#16213e"/>
          </linearGradient>
          <linearGradient id="progress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#DC143C"/>
            <stop offset="100%" style="stop-color:#ff6b6b"/>
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="934" height="282" rx="20" fill="url(#bg)"/>
        
        <!-- Avatar placeholder -->
        <circle cx="141" cy="141" r="80" fill="#2d2d44"/>
        <text x="141" y="155" text-anchor="middle" fill="#888" font-size="40" font-family="Arial">?</text>
        
        <!-- Username -->
        <text x="260" y="80" fill="#ffffff" font-size="36" font-weight="bold" font-family="Arial">${username}</text>
        
        <!-- Rank -->
        <text x="260" y="120" fill="#888888" font-size="20" font-family="Arial">Rank #${rank}</text>
        
        <!-- Level -->
        <text x="860" y="80" text-anchor="end" fill="#DC143C" font-size="36" font-weight="bold" font-family="Arial">LVL ${level}</text>
        
        <!-- XP Progress bar background -->
        <rect x="260" y="160" width="600" height="30" rx="15" fill="#2d2d44"/>
        
        <!-- XP Progress bar fill -->
        <rect x="260" y="160" width="${progress * 6}" height="30" rx="15" fill="url(#progress)"/>
        
        <!-- XP Text -->
        <text x="560" y="220" text-anchor="middle" fill="#888888" font-size="18" font-family="Arial">${xp} / ${requiredXp} XP</text>
      </svg>
    `.trim();

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate rank card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/images/rank-card',
      }
    );
    return errors.internal(c, 'Failed to generate rank card');
  }
});

/**
 * GET /images/welcome
 * Generate a welcome image for new members
 */
images.get('/welcome', async (c) => {
  const query = c.req.query();

  const username = query.username || 'Member';
  const memberCount = query.memberCount || '???';
  const guildName = query.guildName || 'Server';

  try {
    const svg = `
      <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e"/>
            <stop offset="100%" style="stop-color:#16213e"/>
          </linearGradient>
        </defs>
        
        <rect width="1024" height="500" fill="url(#bg)"/>
        
        <!-- Welcome text -->
        <text x="512" y="150" text-anchor="middle" fill="#DC143C" font-size="48" font-weight="bold" font-family="Arial">WELCOME</text>
        
        <!-- Username -->
        <text x="512" y="250" text-anchor="middle" fill="#ffffff" font-size="64" font-weight="bold" font-family="Arial">${username}</text>
        
        <!-- Member count -->
        <text x="512" y="350" text-anchor="middle" fill="#888888" font-size="28" font-family="Arial">Member #${memberCount} of ${guildName}</text>
      </svg>
    `.trim();

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    const logger = createLogger(c);
    logger.error(
      'Failed to generate welcome card',
      error instanceof Error ? error : undefined,
      {
        endpoint: '/images/welcome',
      }
    );
    return errors.internal(c, 'Failed to generate welcome card');
  }
});

/**
 * GET /images/leaderboard
 * Generate a leaderboard image
 */
images.get('/leaderboard', async (c) => {
  // TODO: Implement leaderboard image generation
  return errors.notFound(c, 'Leaderboard image generation not yet implemented');
});

export default images;
