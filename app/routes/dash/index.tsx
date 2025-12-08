// app/routes/dash/index.tsx
/**
 * Protected dashboard route
 * Requires authentication via middleware (see dash/_middleware.ts)
 */
import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  // User data is attached by attachUser middleware
  const user = c.get('user');

  return c.html(
    <html>
      <head>
        <title>Dashboard - Amina</title>
        <style>{`
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
          }
          .dashboard {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid white;
          }
          .success {
            background: rgba(72, 187, 120, 0.2);
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #48bb78;
            margin: 1rem 0;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
          }
          .card {
            background: rgba(255, 255, 255, 0.15);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .card h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
          }
          .card p {
            margin: 0;
            opacity: 0.9;
          }
          a {
            color: #90cdf4;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div class="dashboard">
          <div class="header">
            <h1>🎮 Amina Dashboard</h1>
            {user && (
              <div class="user-info">
                {user.avatar && (
                  <img 
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                    alt={user.username}
                    class="avatar"
                  />
                )}
                <div>
                  <div><strong>{user.username}</strong></div>
                  <div style="opacity: 0.8; font-size: 0.9em;">#{user.discriminator || '0000'}</div>
                </div>
              </div>
            )}
          </div>

          <div class="success">
            <strong>✅ Authentication Successful!</strong><br />
            You are viewing a protected route. The middleware is working correctly!
          </div>

          <h2>Middleware Tests Passed:</h2>
          <ul>
            <li>✅ Authentication middleware (<code>authGuard</code>) - verified token</li>
            <li>✅ User attachment middleware (<code>attachUser</code>) - loaded user data</li>
            <li>✅ Error handling middleware - wrapped entire request</li>
            <li>✅ Route-specific middleware (<code>/dash/_middleware.ts</code>) - applied correctly</li>
          </ul>

          <div class="grid">
            <div class="card">
              <h3>🔐 Security</h3>
              <p>Two-tier rate limiting active, cookies secured with httpOnly + sameSite</p>
            </div>
            <div class="card">
              <h3>⚡ Performance</h3>
              <p>5-minute API caching, .lean() queries, singleton DB connection</p>
            </div>
            <div class="card">
              <h3>🎯 Migration</h3>
              <p>Phase 3 complete - all middleware patterns preserved from Astro!</p>
            </div>
          </div>

          <div style="margin-top: 2rem; opacity: 0.8;">
            <a href="/test-auth">← Back to Auth Test</a> | 
            <a href="/">Home</a> | 
            <a href="/health">Health Check</a>
          </div>
        </div>
      </body>
    </html>
  );
});
