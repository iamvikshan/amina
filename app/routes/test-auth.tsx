// app/routes/test-auth.tsx
/**
 * Test route to verify authentication middleware
 * This is a public route that will display auth status
 */
import { createRoute } from 'honox/factory';
import { getAuthCookies } from '../lib/cookie-utils';

export default createRoute((c) => {
  const { accessToken, userId } = getAuthCookies(c);
  const isAuthenticated = !!(accessToken && userId);

  return c.html(
    <html>
      <head>
        <title>Auth Test - Amina Dashboard</title>
        <style>{`
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            line-height: 1.6;
          }
          .status {
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
          }
          .authenticated {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
          }
          .unauthenticated {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }
          code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
          }
          .links {
            margin-top: 2rem;
          }
          .links a {
            display: inline-block;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .links a:hover {
            background: #0056b3;
          }
        `}</style>
      </head>
      <body>
        <h1>🔐 Authentication Test</h1>
        
        <div class={isAuthenticated ? 'status authenticated' : 'status unauthenticated'}>
          <h2>{isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</h2>
          {isAuthenticated ? (
            <p>
              <strong>User ID:</strong> <code>{userId}</code><br />
              <strong>Token:</strong> <code>{accessToken?.substring(0, 20)}...</code>
            </p>
          ) : (
            <p>No authentication cookies found. Please log in via Discord.</p>
          )}
        </div>

        <div>
          <h3>Middleware Tests:</h3>
          <ul>
            <li>✅ Public route (this page) - accessible without auth</li>
            <li>⚠️ Protected route <code>/dash</code> - requires auth (try accessing)</li>
            <li>⚠️ API route <code>/api/user</code> - requires auth</li>
          </ul>
        </div>

        <div class="links">
          <a href="/">Home</a>
          <a href="/dash">Protected Dashboard (will redirect if not logged in)</a>
          <a href="/health">Health Check</a>
        </div>
      </body>
    </html>
  );
});
