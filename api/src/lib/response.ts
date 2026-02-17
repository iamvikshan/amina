import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Create a successful API response
 */
export function success<T>(
  c: Context,
  data: T,
  options?: {
    status?: ContentfulStatusCode;
    cached?: boolean;
    cacheAge?: number;
  }
): Response {
  const meta: Extract<ApiResponse<T>, { success: true }>['meta'] = {
    generatedAt: new Date().toISOString(),
  };
  if (options?.cached !== undefined) meta.cached = options.cached;
  if (options?.cacheAge !== undefined) meta.cacheAge = options.cacheAge;

  const response: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };

  return c.json(response, (options?.status || 200) as ContentfulStatusCode);
}

/**
 * Create an error API response
 */
export function error(
  c: Context,
  message: string,
  options?: {
    status?: ContentfulStatusCode;
    code?: string;
    details?: unknown;
  }
): Response {
  const errorObj: Extract<ApiResponse, { success: false }>['error'] = {
    message,
  };
  if (options?.code) errorObj.code = options.code;
  if (options?.details) errorObj.details = options.details;

  const response: ApiResponse = {
    success: false,
    error: errorObj,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  };

  return c.json(response, (options?.status || 500) as ContentfulStatusCode);
}

/**
 * Common error responses
 */
export const errors = {
  badRequest: (c: Context, message = 'Bad request') =>
    error(c, message, { status: 400, code: 'BAD_REQUEST' }),

  unauthorized: (c: Context, message = 'Unauthorized') =>
    error(c, message, { status: 401, code: 'UNAUTHORIZED' }),

  forbidden: (c: Context, message = 'Forbidden') =>
    error(c, message, { status: 403, code: 'FORBIDDEN' }),

  notFound: (c: Context, message = 'Not found') =>
    error(c, message, { status: 404, code: 'NOT_FOUND' }),

  rateLimit: (c: Context, message = 'Rate limit exceeded') =>
    error(c, message, { status: 429, code: 'RATE_LIMIT_EXCEEDED' }),

  internal: (c: Context, message = 'Internal server error') =>
    error(c, message, { status: 500, code: 'INTERNAL_ERROR' }),
};
