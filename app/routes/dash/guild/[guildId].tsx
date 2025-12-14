import { createRoute } from 'honox/factory';
import { GuildManager } from '@/lib/database/mongoose';
import { getDiscordUserData } from '@/lib/data-utils';

export default createRoute(async (c) => {
  c.header('Cache-Control', 'private, no-cache, must-revalidate');

  const guildId = c.req.param('guildId');
  if (!guildId) {
    return c.redirect('/dash');
  }

  try {
    // Mirror Astro: load user (ensures auth cookies are valid) then guild from DB
    await getDiscordUserData(c);

    const guildManager = await GuildManager.getInstance();
    const guild = await guildManager.getGuild(guildId);

    if (!guild) {
      return c.redirect(
        `/dash?error=${encodeURIComponent(
          'Guild not found. Please add the bot to your server first.'
        )}`
      );
    }

    if (guild.server.leftAt) {
      return c.redirect(
        `/dash?error=${encodeURIComponent(
          'The bot has left this server. Please re-add it to manage settings.'
        )}`
      );
    }

    return c.render(
      <main
        style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}
      >
        <h1>{guild.server.name}</h1>
        <p>Guild dashboard page is being migrated from Astro → HonoX.</p>
        <ul>
          <li>
            <strong>Guild ID:</strong> {guild._id}
          </li>
          <li>
            <strong>Region:</strong> {guild.server.region}
          </li>
        </ul>
        <p>
          <a href="/dash">Back to dashboard</a>
        </p>
      </main>
    );
  } catch (err) {
    console.error('Error loading guild dashboard:', err);
    return c.redirect(
      `/dash?error=${encodeURIComponent(
        'Failed to load guild settings. Please try again.'
      )}`
    );
  }
});
