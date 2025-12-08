import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { showRoutes } from 'hono/dev';
import { errorHandler } from './middleware';

const app = new Hono();

// Apply global error handling middleware
app.use('*', errorHandler);

// Serve static files from public directory
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amina-dashboard-honox',
  });
});

// Root route
app.get('/', (c) => {
  return c.html(
    '<html><head><title>Amina Dashboard - HonoX</title></head><body><h1>HonoX is running! 🚀</h1><p>Port: 5173</p></body></html>'
  );
});

// Show routes in development
if (process.env.NODE_ENV !== 'production') {
  showRoutes(app);
}

export default app;
