import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  c.header('Cache-Control', 'private, no-cache, must-revalidate');

  return c.render(
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
      <h1>Guilds</h1>
      <p>This page is being migrated from Astro → HonoX.</p>
      <p>
        If you were sent here from the dashboard, you can go back to{' '}
        <a href="/dash">/dash</a>.
      </p>
    </main>
  );
});
