import type { Context } from 'hono';
import { env } from '@config/env';
import { clearAuthCookies, getAuthCookies } from '@lib/cookie-utils';
import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c: Context) => {
  try {
    // Get the access token before clearing cookies
    const { accessToken } = getAuthCookies(c);

    // Clear all auth cookies
    clearAuthCookies(c);

    // Revoke Discord OAuth2 token if it exists
    if (accessToken) {
      try {
        const response = await fetch(
          'https://discord.com/api/oauth2/token/revoke',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              token: accessToken,
              client_id: env.CLIENT_ID,
              client_secret: env.CLIENT_SECRET,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            'Failed to revoke Discord token:',
            await response.text()
          );
        }
      } catch (error) {
        console.error('Error revoking Discord token:', error);
        // Continue with logout even if token revocation fails
      }
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Clear-Site-Data': '"cookies", "storage"',
      },
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export const GET = createRoute((c: Context) => c.redirect('/'));
