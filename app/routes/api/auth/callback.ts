/**
 * OAuth Callback Endpoint
 * Route: GET /api/auth/callback
 * Handles Discord OAuth callback and creates session
 */

import { Hono } from 'hono';
import { discordAuth, API_ENDPOINT } from '@lib/discord-auth';
import { sessionUtils } from '@lib/cookie-utils';
import { getOAuthRedirect } from '@config/permalinks';

const app = new Hono();

app.get('/', async (c) => {
  const code = c.req.query('code');
  // TODO: Implement proper CSRF protection with server-side state validation
  // Currently state is only used for locale (matching reference implementation)
  const state = c.req.query('state'); // locale or empty string

  if (!code) {
    return c.text('Missing authorization code', 400);
  }

  console.log('[OAuth Callback] Processing callback...');

  try {
    // Exchange code for token
    const redirectUri = getOAuthRedirect();
    const token = await discordAuth.exchangeCode(code, redirectUri);

    // Fetch user info from Discord
    const userResponse = await fetch(`${API_ENDPOINT}/users/@me`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const user = await userResponse.json();

    // TODO: Store user in database
    // const userManager = new UserManager(await getMongoClient());
    // await userManager.upsertUser({
    //   id: user.id,
    //   username: user.username,
    //   discriminator: user.discriminator,
    //   avatar: user.avatar,
    //   email: user.email,
    // });

    // Create session - store the token directly
    sessionUtils.setSession(c, token);

    // Also set user context (optional, for backward compat)
    c.set('user', user);

    // Redirect to dashboard
    return c.redirect('/dash');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.text('Authentication failed', 500);
  }
});

export default app;
