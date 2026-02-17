/**
 * V1 Image Overlays API
 *
 * Various image overlays like "approved", "wasted", etc.
 */

import { Hono } from 'hono';
import { requireApiKey, requirePermission } from '../../middleware/auth';
import { errors } from '../../lib/response';

const overlays = new Hono<{ Bindings: Env }>();

// Apply API key authentication
overlays.use('*', requireApiKey);
overlays.use('*', requirePermission('images'));

// Helper to validate and get image URL
function getImageUrl(c: {
  req: { query: (key: string) => string | undefined };
}): string | null {
  const url = c.req.query('image') || c.req.query('url');
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/**
 * GET /v1/images/overlays/approved
 * Draw "APPROVED" stamp over image
 */
overlays.get('/approved', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image xlink:href="${imageUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  <g transform="translate(${w / 2}, ${h / 2}) rotate(-15)">
    <rect x="-${w * 0.4}" y="-40" width="${w * 0.8}" height="80" fill="none" stroke="#22c55e" stroke-width="8" rx="10"/>
    <text x="0" y="15" text-anchor="middle" fill="#22c55e" font-size="48" font-weight="bold" font-family="Impact, Arial Black, sans-serif">APPROVED</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/rejected
 * Draw "REJECTED" stamp over image
 */
overlays.get('/rejected', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image xlink:href="${imageUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  <g transform="translate(${w / 2}, ${h / 2}) rotate(-15)">
    <rect x="-${w * 0.4}" y="-40" width="${w * 0.8}" height="80" fill="none" stroke="#ef4444" stroke-width="8" rx="10"/>
    <text x="0" y="15" text-anchor="middle" fill="#ef4444" font-size="48" font-weight="bold" font-family="Impact, Arial Black, sans-serif">REJECTED</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/wasted
 * GTA "WASTED" effect
 */
overlays.get('/wasted', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="desaturate">
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.7"/>
        <feFuncG type="linear" slope="0.7"/>
        <feFuncB type="linear" slope="0.7"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image xlink:href="${imageUrl}" width="${w}" height="${h}" filter="url(#desaturate)" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${w}" height="${h}" fill="rgba(255,0,0,0.2)"/>
  <text x="${w / 2}" y="${h / 2 + 20}" text-anchor="middle" fill="#c41e3a" font-size="72" font-weight="bold" font-family="Pricedown, Impact, Arial Black, sans-serif" letter-spacing="0.1em" stroke="#000" stroke-width="3">WASTED</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/triggered
 * "TRIGGERED" meme effect
 */
overlays.get('/triggered', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="red-tint">
      <feColorMatrix type="matrix" values="
        1.2 0 0 0 0.1
        0 0.8 0 0 0
        0 0 0.8 0 0
        0 0 0 1 0
      "/>
    </filter>
  </defs>
  <image xlink:href="${imageUrl}" width="${w}" height="${h - 50}" filter="url(#red-tint)" preserveAspectRatio="xMidYMid slice"/>
  <rect y="${h - 50}" width="${w}" height="50" fill="#ff0000"/>
  <text x="${w / 2}" y="${h - 15}" text-anchor="middle" fill="#ffffff" font-size="36" font-weight="bold" font-family="Impact, Arial Black, sans-serif">TRIGGERED</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/gay
 * Rainbow pride overlay
 */
overlays.get('/gay', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);
  const opacity = Math.min(
    1,
    Math.max(0, parseFloat(c.req.query('opacity') || '0.5'))
  );

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="rainbow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e40303"/>
      <stop offset="16.67%" style="stop-color:#ff8c00"/>
      <stop offset="33.33%" style="stop-color:#ffed00"/>
      <stop offset="50%" style="stop-color:#008026"/>
      <stop offset="66.67%" style="stop-color:#24408e"/>
      <stop offset="100%" style="stop-color:#732982"/>
    </linearGradient>
  </defs>
  <image xlink:href="${imageUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${w}" height="${h}" fill="url(#rainbow)" opacity="${opacity}"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/jail
 * Prison bars overlay
 */
overlays.get('/jail', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  // Generate jail bars
  const barWidth = 12;
  const barSpacing = 60;
  const bars = [];
  for (let x = barSpacing; x < w; x += barSpacing) {
    bars.push(
      `<rect x="${x - barWidth / 2}" y="0" width="${barWidth}" height="${h}" fill="#333" opacity="0.8"/>`
    );
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image xlink:href="${imageUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  <!-- Horizontal bars -->
  <rect x="0" y="${h * 0.2}" width="${w}" height="${barWidth}" fill="#333" opacity="0.8"/>
  <rect x="0" y="${h * 0.8 - barWidth}" width="${w}" height="${barWidth}" fill="#333" opacity="0.8"/>
  <!-- Vertical bars -->
  ${bars.join('\n  ')}
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/overlays/rip
 * R.I.P. gravestone effect
 */
overlays.get('/rip', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="dark">
      <feColorMatrix type="saturate" values="0.3"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.5"/>
        <feFuncG type="linear" slope="0.5"/>
        <feFuncB type="linear" slope="0.5"/>
      </feComponentTransfer>
    </filter>
    <clipPath id="avatar-clip">
      <ellipse cx="${w / 2}" cy="${h * 0.35}" rx="${w * 0.2}" ry="${h * 0.15}"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="${w}" height="${h}" fill="#1a1a1a"/>
  
  <!-- Gravestone -->
  <path d="M${w * 0.2},${h * 0.8} L${w * 0.2},${h * 0.25} Q${w * 0.2},${h * 0.1} ${w * 0.5},${h * 0.1} Q${w * 0.8},${h * 0.1} ${w * 0.8},${h * 0.25} L${w * 0.8},${h * 0.8} Z" fill="#555"/>
  
  <!-- Avatar in gravestone -->
  <image xlink:href="${imageUrl}" x="${w * 0.3}" y="${h * 0.2}" width="${w * 0.4}" height="${h * 0.3}" clip-path="url(#avatar-clip)" filter="url(#dark)" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- RIP text -->
  <text x="${w / 2}" y="${h * 0.6}" text-anchor="middle" fill="#888" font-size="48" font-weight="bold" font-family="Times New Roman, serif">R.I.P.</text>
  
  <!-- Ground -->
  <rect y="${h * 0.8}" width="${w}" height="${h * 0.2}" fill="#2d2d1a"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

export default overlays;
