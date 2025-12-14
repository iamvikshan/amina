import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  c.header('Cache-Control', 'private, no-cache, must-revalidate');

  const userId = c.req.param('userId');
  if (!userId) {
    return c.redirect('/dash');
  }

  return c.render(
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
      <h1>User</h1>
      <p>User profile page is being migrated from Astro → HonoX.</p>
      <p>
        <strong>User ID:</strong> {userId}
      </p>
      <p>
        <a href="/dash">Back to dashboard</a>
      </p>
    </main>
  );
});
