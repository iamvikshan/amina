// app/middleware/error.ts
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '@lib/errors';

/**
 * Global error handling middleware for HonoX
 *
 * Handles all errors thrown in the application:
 * - Custom AppError types (with status codes)
 * - Standard Error instances
 * - HTTP exceptions
 * - Unexpected errors
 *
 * Behavior:
 * - Development: Returns full error details including stack traces
 * - Production: Returns sanitized error messages
 * - Logs all errors to console for monitoring
 */
export const errorHandler = createMiddleware(async (c: Context, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error caught by middleware:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: c.req.url,
      method: c.req.method,
    });

    // Handle Hono's HTTPException
    if (error instanceof HTTPException) {
      return c.json(
        {
          status: error.status,
          message: error.message,
          code: 'HTTP_EXCEPTION',
        },
        error.status
      );
    }

    // Handle custom AppError types
    if (error instanceof AppError) {
      const status = error.statusCode as ContentfulStatusCode;

      // Special redirects for auth errors
      if (error instanceof AuthenticationError) {
        return c.redirect('/auth/login?error=unauthenticated');
      }

      if (error instanceof AuthorizationError) {
        return c.redirect('/403');
      }

      if (error instanceof NotFoundError) {
        return c.notFound();
      }

      if (error instanceof ValidationError) {
        return c.json(
          {
            status: 400,
            message: error.message,
            code: error.code || 'VALIDATION_ERROR',
            errors: (error as any).errors || undefined,
          },
          400
        );
      }

      // Generic AppError response
      return c.json(
        {
          status,
          message: error.message,
          code: error.code || 'APP_ERROR',
        },
        status
      );
    }

    // Handle standard Error instances
    const isProd = process.env.NODE_ENV === 'production';
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log unknown errors
    if (!(error instanceof AppError)) {
      console.error('Unhandled error:', error);
    }

    // Return error response
    return c.json(
      {
        status: 500,
        message: isProd ? 'Internal server error' : errorMessage,
        code: 'INTERNAL_ERROR',
        ...(isProd ? {} : { stack: errorStack }),
      },
      500
    );
  }
});

/**
 * 404 Not Found handler
 * Apply this at the end of your route definitions
 */
export const notFoundHandler = createMiddleware(async (c: Context) => {
  return c.json(
    {
      status: 404,
      message: 'Not Found',
      code: 'NOT_FOUND',
      path: c.req.url,
    },
    404
  );
});
