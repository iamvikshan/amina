/**
 * OAuth Login Endpoint
 * Route: GET /api/auth/login
 * Redirects to Discord OAuth authorization
 */

import { Hono } from 'hono';
import { discordAuth } from '@lib/discord-auth';
import { getOAuthRedirect } from '@config/permalinks';

const app = new Hono();

app.get('/', (c) => {
  // TODO: Implement proper CSRF protection with server-side state validation
  // Currently matching reference implementation which uses state for locale only
  const locale = c.req.query('locale') ?? '';

  // Redirect to Discord OAuth
  const redirectUri = getOAuthRedirect();
  const authUrl = discordAuth.getAuthUrl(redirectUri, locale);

  console.log('[OAuth Login] Redirecting to Discord OAuth');

  return c.redirect(authUrl);
});

export default app;
