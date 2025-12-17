import { createApp } from 'honox/server';
import { serveStatic } from 'hono/bun';
import { showRoutes } from 'hono/dev';
// import { errorHandler } from '@/middleware';

// HonoX app wires file-based routes under `app/routes/*`
const app = createApp();

// Apply global error handling middleware
//app.use('*', errorHandler);

// Serve static files. In production, assets are emitted under dist/static.
// In development, Vite will handle module assets.
app.use('/static/*', serveStatic({ root: './dist' }));
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/social.png', serveStatic({ path: './public/social.png' }));
app.use(
  '/banner-pattern.svg',
  serveStatic({ path: './public/banner-pattern.svg' })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amina-dashboard-honox',
  });
});

// NOTE: Root route is served by `app/routes/index.tsx` via HonoX.

// Show routes in development
if (process.env.NODE_ENV !== 'production') {
  showRoutes(app);
}

export default app;
