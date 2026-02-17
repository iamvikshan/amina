/**
 * API-related type definitions
 */

/// <reference path="./env.d.ts" />
import type { Context } from 'hono';

declare global {
  /**
   * Standard API response wrapper - discriminated union for type safety
   */
  type ApiResponse<T = unknown> =
    | {
        success: true;
        data: T;
        meta: {
          generatedAt: string;
          cached?: boolean;
          cacheAge?: number;
        };
      }
    | {
        success: false;
        error: {
          message: string;
          code?: string;
          details?: unknown;
        };
        meta: {
          generatedAt: string;
        };
      };

  /**
   * Rate limiting configuration
   */
  interface RateLimitConfig {
    requests: number;
    window: number;
  }

  /**
   * Rate limiting middleware configuration
   */
  interface RateLimitMiddlewareConfig {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    keyGenerator?: (c: Context<{ Bindings: Env }>) => string | Promise<string>;
  }

  /**
   * Rate limiting result
   */
  interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number; // Unix timestamp when limit resets
    limit: number;
  }
}
