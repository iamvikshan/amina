/**
 * Shared SVG/XML utilities for safe SVG generation.
 *
 * Centralizes escaping and sanitization to prevent XSS/injection
 * in dynamically generated SVG output.
 */

/**
 * Escape XML/SVG special characters to prevent injection.
 * Use for ALL user-controlled text interpolated into SVG markup.
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Sanitize a URL for safe use in SVG attributes (xlink:href, href).
 * Only allows http: and https: schemes. Returns empty string for unsafe URLs.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeXml(url)
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * Validate and get an image URL from query params.
 * Only allows http: and https: schemes.
 * Returns XML-escaped URL for safe SVG embedding, or null if missing/invalid.
 *
 * The returned URL is escaped with escapeXml() so it can be safely
 * interpolated into SVG attributes without additional escaping.
 */
export function getImageUrl(c: {
  req: { query: (key: string) => string | undefined }
}): string | null {
  const url = c.req.query('image') || c.req.query('url')
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeXml(url)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Clamp a dimension value to a safe range for SVG generation.
 * Ensures the value is a finite number within [min, max].
 */
export function clampDimension(
  value: number,
  min = 1,
  max = 2048,
  fallback = 512
): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

/**
 * Safely parse a numeric query parameter with default, min, and max.
 * Returns defaultValue if the string is undefined, empty, or not a finite number.
 * Clamps between min/max if provided.
 */
export function parseNumberOrDefault(
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (value === undefined || value.trim() === '') return defaultValue
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return defaultValue
  let result = parsed
  if (min !== undefined) result = Math.max(min, result)
  if (max !== undefined) result = Math.min(max, result)
  return result
}

/**
 * Create a Response with SVG content-type and cache headers.
 * Replaces repeated `new Response(svg, { headers: { ... } })` patterns.
 */
export function svgResponse(
  svg: string,
  maxAge = 3600,
  staleWhileRevalidate?: number
): Response {
  const cacheControl =
    staleWhileRevalidate !== undefined
      ? `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      : `public, max-age=${maxAge}`
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': cacheControl,
    },
  })
}

/**
 * Validate a hex color string.
 * Accepts #RGB, #RGBA, #RRGGBB, and #RRGGBBAA formats.
 */
export function validateHexColor(color: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    color
  )
}
