/**
 * V1 Meme Generators API
 *
 * Classic meme templates with text overlay support.
 */

import { Hono } from 'hono';
import { requireApiKey, requirePermission } from '../../middleware/auth';
import { errors } from '../../lib/response';

const generators = new Hono<{ Bindings: Env }>();

// Apply API key authentication
generators.use('*', requireApiKey);
generators.use('*', requirePermission('images'));

// Helper to escape XML
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to get image URL
function getImageUrl(
  c: { req: { query: (key: string) => string | undefined } },
  param = 'image'
): string | null {
  const url = c.req.query(param) || c.req.query('url');
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/**
 * GET /v1/images/generators/affect
 * "Does this affect my baby?" meme
 */
generators.get('/affect', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const svg = `<svg width="500" height="418" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background (newspaper style) -->
  <rect width="500" height="418" fill="#f5f5dc"/>
  
  <!-- Title -->
  <text x="250" y="40" text-anchor="middle" fill="#333" font-size="24" font-weight="bold" font-family="Times New Roman, serif">WILL THIS AFFECT MY BABY?</text>
  
  <!-- Article boxes -->
  <rect x="20" y="60" width="220" height="150" fill="#e8e8d0" stroke="#333" stroke-width="1"/>
  <rect x="260" y="60" width="220" height="150" fill="#e8e8d0" stroke="#333" stroke-width="1"/>
  
  <!-- User image in right box -->
  <image xlink:href="${imageUrl}" x="265" y="65" width="210" height="140" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Bottom section -->
  <rect x="20" y="230" width="460" height="168" fill="#e8e8d0" stroke="#333" stroke-width="1"/>
  
  <!-- "NO" text -->
  <text x="250" y="330" text-anchor="middle" fill="#c41e3a" font-size="72" font-weight="bold" font-family="Impact, Arial Black, sans-serif">NO.</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/beautiful
 * "It's beautiful" meme
 */
generators.get('/beautiful', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background -->
  <rect width="400" height="400" fill="#2d2d2d"/>
  
  <!-- Frame -->
  <rect x="50" y="50" width="300" height="240" fill="#8b4513" rx="5"/>
  <rect x="60" y="60" width="280" height="220" fill="#1a1a1a"/>
  
  <!-- Image inside frame -->
  <image xlink:href="${imageUrl}" x="70" y="70" width="260" height="200" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Text -->
  <text x="200" y="340" text-anchor="middle" fill="#fff" font-size="28" font-family="Comic Sans MS, cursive">It's beautiful...</text>
  <text x="200" y="375" text-anchor="middle" fill="#888" font-size="18" font-family="Comic Sans MS, cursive">I've looked at this for 5 hours now</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/changemymind
 * "Change My Mind" meme
 */
generators.get('/changemymind', async (c) => {
  const text = c.req.query('text') || 'Change my mind';

  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background (outdoor scene) -->
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#87ceeb"/>
      <stop offset="100%" style="stop-color:#e0f7fa"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <rect y="280" width="600" height="120" fill="#228b22"/>
  
  <!-- Table -->
  <rect x="180" y="220" width="350" height="80" fill="#8b4513" rx="5"/>
  <rect x="240" y="300" width="20" height="80" fill="#5d4037"/>
  <rect x="440" y="300" width="20" height="80" fill="#5d4037"/>
  
  <!-- Sign on table -->
  <rect x="200" y="180" width="300" height="100" fill="#fff" stroke="#333" stroke-width="2" rx="3"/>
  
  <!-- User text -->
  <text x="350" y="230" text-anchor="middle" fill="#333" font-size="18" font-weight="bold" font-family="Arial, sans-serif">${escapeXml(text)}</text>
  
  <!-- "Change my mind" subtitle -->
  <text x="350" y="260" text-anchor="middle" fill="#666" font-size="14" font-family="Arial, sans-serif">CHANGE MY MIND</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/delete
 * "Delet this" meme
 */
generators.get('/delete', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background -->
  <rect width="400" height="400" fill="#1a1a1a"/>
  
  <!-- User image -->
  <image xlink:href="${imageUrl}" x="50" y="50" width="300" height="250" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- DELETE button style -->
  <rect x="100" y="320" width="200" height="50" fill="#dc143c" rx="5"/>
  <text x="200" y="355" text-anchor="middle" fill="#fff" font-size="28" font-weight="bold" font-family="Arial, sans-serif">DELET THIS</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/trash
 * "I Love This" / "It's Trash" meme
 */
generators.get('/trash', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const svg = `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background -->
  <rect width="400" height="500" fill="#f0f0f0"/>
  
  <!-- Panel 1: Looking at thing -->
  <rect x="10" y="10" width="380" height="200" fill="#fff" stroke="#333" stroke-width="2"/>
  <text x="200" y="40" text-anchor="middle" fill="#333" font-size="16" font-family="Comic Sans MS, cursive">"Ooh what's this?"</text>
  <image xlink:href="${imageUrl}" x="120" y="50" width="160" height="150" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Panel 2: Throws away -->
  <rect x="10" y="220" width="380" height="270" fill="#fff" stroke="#333" stroke-width="2"/>
  <text x="200" y="260" text-anchor="middle" fill="#333" font-size="20" font-weight="bold" font-family="Comic Sans MS, cursive">"Oh, it's garbage."</text>
  
  <!-- Trash can -->
  <rect x="150" y="300" width="100" height="150" fill="#555" rx="5"/>
  <rect x="140" y="290" width="120" height="20" fill="#666" rx="3"/>
  
  <!-- Small image in trash -->
  <image xlink:href="${imageUrl}" x="160" y="320" width="80" height="80" opacity="0.7" preserveAspectRatio="xMidYMid slice"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/drake
 * Drake approve/disapprove meme
 */
generators.get('/drake', async (c) => {
  const topText = c.req.query('top') || c.req.query('reject') || 'Bad thing';
  const bottomText =
    c.req.query('bottom') || c.req.query('approve') || 'Good thing';

  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="600" height="400" fill="#f5f5dc"/>
  
  <!-- Top panel (reject) -->
  <rect x="0" y="0" width="300" height="200" fill="#fef3c7" stroke="#333" stroke-width="2"/>
  <text x="150" y="30" text-anchor="middle" fill="#dc143c" font-size="36">🙅</text>
  <text x="150" y="120" text-anchor="middle" fill="#666" font-size="20" font-family="Arial, sans-serif">Nah</text>
  
  <rect x="300" y="0" width="300" height="200" fill="#fff" stroke="#333" stroke-width="2"/>
  <text x="450" y="110" text-anchor="middle" fill="#333" font-size="20" font-weight="bold" font-family="Arial, sans-serif">${escapeXml(topText)}</text>
  
  <!-- Bottom panel (approve) -->
  <rect x="0" y="200" width="300" height="200" fill="#d1fae5" stroke="#333" stroke-width="2"/>
  <text x="150" y="230" text-anchor="middle" fill="#22c55e" font-size="36">👉</text>
  <text x="150" y="320" text-anchor="middle" fill="#666" font-size="20" font-family="Arial, sans-serif">Yeah!</text>
  
  <rect x="300" y="200" width="300" height="200" fill="#fff" stroke="#333" stroke-width="2"/>
  <text x="450" y="310" text-anchor="middle" fill="#333" font-size="20" font-weight="bold" font-family="Arial, sans-serif">${escapeXml(bottomText)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/generators/distracted
 * Distracted boyfriend meme labels
 */
generators.get('/distracted', async (c) => {
  const boyfriend = c.req.query('boyfriend') || 'Me';
  const girlfriend = c.req.query('girlfriend') || 'My responsibilities';
  const other = c.req.query('other') || 'Literally anything else';

  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="600" height="400" fill="#333"/>
  
  <!-- Placeholder for meme image (would need actual image) -->
  <rect x="50" y="50" width="500" height="300" fill="#666" rx="10"/>
  <text x="300" y="200" text-anchor="middle" fill="#888" font-size="24" font-family="Arial, sans-serif">[Distracted Boyfriend Meme]</text>
  
  <!-- Labels -->
  <g font-family="Impact, Arial Black, sans-serif" font-size="18" fill="#fff" stroke="#000" stroke-width="1">
    <text x="450" y="150">${escapeXml(other)}</text>
    <text x="280" y="200">${escapeXml(boyfriend)}</text>
    <text x="100" y="250">${escapeXml(girlfriend)}</text>
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
 * GET /v1/images/generators/facts
 * "Facts" book meme
 */
generators.get('/facts', async (c) => {
  const text = c.req.query('text') || 'This is a fact';

  // Word wrap helper
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > 25) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineElements = lines
    .map(
      (line, i) =>
        `<text x="300" y="${160 + i * 30}" text-anchor="middle" fill="#333" font-size="20" font-weight="bold" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
    )
    .join('\n');

  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="600" height="400" fill="#8b4513"/>
  
  <!-- Book -->
  <rect x="100" y="80" width="400" height="280" fill="#f5f5dc" rx="5"/>
  <rect x="100" y="80" width="10" height="280" fill="#d4c4a8"/>
  
  <!-- Book title -->
  <text x="300" y="120" text-anchor="middle" fill="#8b4513" font-size="24" font-weight="bold" font-family="Times New Roman, serif">📖 Book of Facts</text>
  
  <!-- Divider -->
  <line x1="150" y1="135" x2="450" y2="135" stroke="#8b4513" stroke-width="2"/>
  
  <!-- User text -->
  ${lineElements}
  
  <!-- Page number -->
  <text x="300" y="340" text-anchor="middle" fill="#666" font-size="14" font-family="Times New Roman, serif">- Page 1 -</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

export default generators;
