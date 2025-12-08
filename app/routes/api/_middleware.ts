// app/routes/api/_middleware.ts
/**
 * API route middleware
 * Applies to all /api/* routes
 */
import { noCache } from '../../middleware';

// API routes should never be cached
export default noCache;
