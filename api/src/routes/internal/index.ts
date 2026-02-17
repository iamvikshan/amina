/**
 * Internal Routes
 *
 * Bot-authenticated endpoints for registration, stats push, and sync
 */

import { Hono } from 'hono';
import { botAuthMiddleware } from '../../middleware/botAuth';
import { botRateLimit } from '../../middleware/rateLimit';

import botsRoutes from './bots';
import guildsRoutes from './guilds';

const internal = new Hono<{ Bindings: Env; Variables: BotAuthContext }>();

// Apply rate limiting to all internal routes
internal.use('*', botRateLimit);

// Registration endpoint doesn't require auth (it IS the auth)
internal.route('/bots', botsRoutes);

// Guild sync requires bot auth
internal.use('/guilds/*', botAuthMiddleware);
internal.route('/guilds', guildsRoutes);

export default internal;
