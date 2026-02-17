/**
 * Bot Authentication Middleware
 *
 * Protects /internal/* routes with bot secret authentication
 */

import type { Context, Next } from 'hono';
import { validateBotRequest } from '../lib/botAuth';
import { errors } from '../lib/response';
import { createLogger } from '../lib/logger';

// ============================================================================
// Secure Bot Secret Accessor
// ============================================================================

/**
 * Secure accessor to get bot client secret for authenticated requests
 * Uses Hono context for request-scoped isolation, preventing race conditions
 * in concurrent requests
 *
 * @param c - Hono context with authenticated bot
 * @returns Bot client secret if authenticated, null otherwise
 */
export function getBotClientSecret(
  c: Context<{ Bindings: Env; Variables: BotAuthContext }>
): string | null {
  return c.get('botClientSecret') || null;
}

/**
 * Middleware to authenticate bot requests
 * Expects X-Client-Id and X-Client-Secret headers
 */
export async function botAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: BotAuthContext }>,
  next: Next
) {
  const clientId = c.req.header('X-Client-Id');
  const clientSecret = c.req.header('X-Client-Secret');

  if (!clientId) {
    return errors.unauthorized(c, 'Missing X-Client-Id header');
  }

  if (!clientSecret) {
    return errors.unauthorized(c, 'Missing X-Client-Secret header');
  }

  const kv = c.env.BOTS;

  if (!kv) {
    const logger = createLogger(c);
    logger.error('BOTS KV namespace not configured', undefined, {
      path: c.req.path,
      method: c.req.method,
      clientId,
    });
    return errors.internal(c, 'Bot authentication unavailable');
  }

  const logger = createLogger(c);
  const validation = await validateBotRequest(
    kv,
    clientId,
    clientSecret,
    logger
  );

  if (!validation.valid) {
    if (validation.needsReVerification) {
      return errors.unauthorized(
        c,
        'Bot credentials expired. Please re-register.'
      );
    }
    return errors.unauthorized(
      c,
      validation.error || 'Invalid bot credentials'
    );
  }

  // Attach bot client ID and secret to context for use in route handlers
  // Using Hono's context ensures request-scoped isolation even under concurrent load
  c.set('botClientId', clientId);
  c.set('botClientSecret', clientSecret);

  await next();
}

/**
 * Optional bot auth - doesn't fail if no credentials provided
 * Useful for endpoints that behave differently for authenticated bots
 */
export async function optionalBotAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: Partial<BotAuthContext> }>,
  next: Next
) {
  const clientId = c.req.header('X-Client-Id');
  const clientSecret = c.req.header('X-Client-Secret');

  if (clientId && clientSecret && c.env.BOTS) {
    const logger = createLogger(c);
    const validation = await validateBotRequest(
      c.env.BOTS,
      clientId,
      clientSecret,
      logger
    );

    if (validation.valid) {
      c.set('botClientId', clientId);
      c.set('botClientSecret', clientSecret);
    } else {
      // Log validation failure for debugging (without exposing clientSecret)
      const logger = createLogger(c);
      logger.warn('Optional bot auth validation failed', {
        clientId,
        reason: validation.error || 'Unknown validation error',
        needsReVerification: validation.needsReVerification || false,
      });
    }
  }

  await next();
}
