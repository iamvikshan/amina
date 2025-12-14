// app/middleware/index.ts
/**
 * Central export for all middleware
 *
 * Import middleware from here to maintain consistency:
 * import { authGuard, errorHandler } from '@/middleware';
 */

export { authGuard, attachUser } from './auth';
export { errorHandler, notFoundHandler } from './error';
export { cacheStatic, cacheAPI, noCache } from './cache';
