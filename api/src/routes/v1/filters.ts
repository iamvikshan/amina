/**
 * V1 Image Filters API
 *
 * SVG-based image filters. These use SVG filter elements
 * which work natively in browsers but may need conversion
 * for raster output.
 */

import { Hono } from 'hono';
import { requireApiKey, requirePermission } from '../../middleware/auth';
import { errors } from '../../lib/response';

const filters = new Hono<{ Bindings: Env }>();

// Apply API key authentication
filters.use('*', requireApiKey);
filters.use('*', requirePermission('images'));

// Helper to validate and get image URL
function getImageUrl(c: {
  req: { query: (key: string) => string | undefined };
}): string | null {
  const url = c.req.query('image') || c.req.query('url');
  if (!url) return null;

  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

// SVG wrapper with filter
function createFilteredImage(
  imageUrl: string,
  filterId: string,
  filterDef: string,
  width = 512,
  height = 512
): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    ${filterDef}
  </defs>
  <image xlink:href="${imageUrl}" width="${width}" height="${height}" filter="url(#${filterId})" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
}

/**
 * GET /v1/images/filters/greyscale
 * Convert image to greyscale
 */
filters.get('/greyscale', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const intensity = parseFloat(c.req.query('intensity') || '1');
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="greyscale">
      <feColorMatrix type="saturate" values="${1 - Math.min(1, Math.max(0, intensity))}"/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'greyscale', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/blur
 * Apply blur effect
 */
filters.get('/blur', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const radius = Math.min(
    50,
    Math.max(0, parseFloat(c.req.query('radius') || '5'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="blur">
      <feGaussianBlur stdDeviation="${radius}"/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'blur', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/sepia
 * Apply sepia filter
 */
filters.get('/sepia', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const intensity = Math.min(
    1,
    Math.max(0, parseFloat(c.req.query('intensity') || '1'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  // Sepia color matrix
  const filter = `
    <filter id="sepia">
      <feColorMatrix type="matrix" values="
        ${0.393 + 0.607 * (1 - intensity)} ${0.769 * intensity} ${0.189 * intensity} 0 0
        ${0.349 * intensity} ${0.686 + 0.314 * (1 - intensity)} ${0.168 * intensity} 0 0
        ${0.272 * intensity} ${0.534 * intensity} ${0.131 + 0.869 * (1 - intensity)} 0 0
        0 0 0 1 0
      "/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'sepia', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/invert
 * Invert colors
 */
filters.get('/invert', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="invert">
      <feColorMatrix type="matrix" values="
        -1 0 0 0 1
        0 -1 0 0 1
        0 0 -1 0 1
        0 0 0 1 0
      "/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'invert', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/brighten
 * Brighten an image
 */
filters.get('/brighten', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const amount = Math.min(
    2,
    Math.max(0, parseFloat(c.req.query('amount') || '1.3'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="brighten">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}"/>
        <feFuncG type="linear" slope="${amount}"/>
        <feFuncB type="linear" slope="${amount}"/>
      </feComponentTransfer>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'brighten', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/darken
 * Darken an image
 */
filters.get('/darken', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const amount = Math.min(
    1,
    Math.max(0, parseFloat(c.req.query('amount') || '0.7'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="darken">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}"/>
        <feFuncG type="linear" slope="${amount}"/>
        <feFuncB type="linear" slope="${amount}"/>
      </feComponentTransfer>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'darken', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/contrast
 * Adjust contrast
 */
filters.get('/contrast', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const amount = Math.min(
    3,
    Math.max(0, parseFloat(c.req.query('amount') || '1.5'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const intercept = 0.5 * (1 - amount);

  const filter = `
    <filter id="contrast">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}" intercept="${intercept}"/>
        <feFuncG type="linear" slope="${amount}" intercept="${intercept}"/>
        <feFuncB type="linear" slope="${amount}" intercept="${intercept}"/>
      </feComponentTransfer>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'contrast', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/pixelate
 * Pixelate effect (approximation using SVG)
 */
filters.get('/pixelate', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const pixels = Math.min(
    50,
    Math.max(2, parseInt(c.req.query('pixels') || '10', 10))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  // Use a small image and scale up with no smoothing
  const scale = 1 / pixels;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="image-rendering: pixelated;">
  <defs>
    <pattern id="pixelate-pattern" width="${w * scale}" height="${h * scale}" patternUnits="userSpaceOnUse">
      <image xlink:href="${imageUrl}" width="${w * scale}" height="${h * scale}" preserveAspectRatio="xMidYMid slice"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#pixelate-pattern)" style="image-rendering: pixelated;"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/saturate
 * Adjust saturation
 */
filters.get('/saturate', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const amount = Math.min(
    3,
    Math.max(0, parseFloat(c.req.query('amount') || '1.5'))
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="saturate">
      <feColorMatrix type="saturate" values="${amount}"/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'saturate', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /v1/images/filters/hue-rotate
 * Rotate hue
 */
filters.get('/hue-rotate', async (c) => {
  const imageUrl = getImageUrl(c);
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL');
  }

  const degrees = parseFloat(
    c.req.query('degrees') || c.req.query('angle') || '90'
  );
  const w = parseInt(c.req.query('width') || '512', 10);
  const h = parseInt(c.req.query('height') || '512', 10);

  const filter = `
    <filter id="hue-rotate">
      <feColorMatrix type="hueRotate" values="${degrees}"/>
    </filter>
  `;

  const svg = createFilteredImage(imageUrl, 'hue-rotate', filter, w, h);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

export default filters;
