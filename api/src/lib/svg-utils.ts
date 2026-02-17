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
 * Returns null if missing or invalid.
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
