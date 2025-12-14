import { createRoute } from 'honox/factory';
import { discordAuth } from '@/lib/discord-auth';
import { setAuthCookies } from '@/lib/cookie-utils';

export default createRoute(async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Mirror Astro behavior: any error or missing code redirects home
  if (error) {
    console.error('Discord auth error:', error);
    return c.redirect('/', 302);
  }

  if (!code) {
    console.error('Missing Discord OAuth code');
    return c.redirect('/', 302);
  }

  try {
    const tokenData = await discordAuth.exchangeCode(code);
    const userData = await discordAuth.getUserInfo(tokenData.access_token);

    setAuthCookies(c, tokenData, userData);

    return c.redirect('/dash', 302);
  } catch (err) {
    console.error('Authentication failed:', err);
    return c.redirect('/', 302);
  }
});
