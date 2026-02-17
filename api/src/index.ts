import { Hono } from 'hono';
import { cors, logger, cacheControl, errorHandler } from './middleware';
import { success } from './lib/response';

// Import routes
import botRoutes from './routes/bot';
import guildRoutes from './routes/guild';
import imagesRoutes from './routes/images';
import v1Routes from './routes/v1';
import internalRoutes from './routes/internal';
import webhookRoutes from './routes/webhooks';

// Create main app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', errorHandler);
app.use('*', cors);
app.use('*', logger);
app.use('*', cacheControl);

// Root endpoint
app.get('/', (c) => {
  return success(c, {
    name: 'Amina API',
    version: '1.0.0',
    description: 'Image generation & utilities API for Amina Discord Bot',
    documentation: 'https://api.apidocs.4mina.app',
    dashboard: 'https://4mina.app/dash/user',
    endpoints: {
      v1: '/v1/* (authenticated)',
      internal: '/internal/* (bot secret auth)',
      bot: '/bot/stats, /bot/health',
      guild: '/guild/*',
      images: '/images/* (legacy)',
      webhooks: '/webhooks/:id/:token/:provider',
    },
  });
});

// Health check (for uptime monitoring)
app.get('/health', (c) => {
  return success(c, {
    status: 'healthy',
    service: 'amina-api',
    environment: c.env.DOPPLER_ENVIRONMENT || 'prd',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.route('/v1', v1Routes);
app.route('/internal', internalRoutes);
app.route('/bot', botRoutes);
app.route('/guild', guildRoutes);
app.route('/images', imagesRoutes); // Legacy, no auth
app.route('/webhooks', webhookRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
      },
      meta: {
        generatedAt: new Date().toISOString(),
      },
    },
    404
  );
});

// Export for Cloudflare Workers
export default app;
