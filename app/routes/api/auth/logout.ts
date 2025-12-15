/**
 * Logout Endpoint
 * Route: GET /api/auth/logout
 * Clears session and redirects to home
 */

import { Hono } from 'hono';
import { sessionUtils } from '@lib/cookie-utils';

const app = new Hono();

app.get('/', async (c) => {
  // TODO: Optionally revoke Discord token
  // const session = sessionUtils.getSession(c);
  // if (session?.accessToken) {
  //   await discordAuth.revokeToken(session.accessToken);
  // }

  // Clear session cookie
  sessionUtils.clearSession(c);

  // Redirect to home
  return c.redirect('/');
});

export default app;
