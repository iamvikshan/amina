/**
 * @deprecated This file has been moved to src/config/site.ts
 *
 * All site configuration, URLs, and SEO metadata now live in:
 * - src/config/site.ts (SITE, URLS, SEO, OG constants)
 * - src/config/permalinks.ts (URL helper functions)
 *
 * Please update your imports to:
 * import { SITE, URLS, SEO, OG } from '@/config/site';
 *
 * This file will be removed in a future update.
 */

// Re-export from new location for backwards compatibility
export { SITE, SEO, OG } from '@/config/site';
