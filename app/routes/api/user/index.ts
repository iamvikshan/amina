/**
 * GET /api/user
 * Fetch current authenticated user's Discord profile
 */

import { createRoute } from 'honox/factory';
import { sessionUtils } from '@lib/cookie-utils';

export default createRoute(async (c) => {
  try {
    const session = sessionUtils.getSession(c);
    if (!session?.access_token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Fetch user profile from Discord API
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user from Discord:', response.status);
      return c.json({ error: 'Failed to fetch user' }, 500);
    }

    const user = await response.json();
    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
