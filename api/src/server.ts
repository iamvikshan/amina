// Local development server using @hono/node-server
// Run with: bun run dev:local

import { serve } from '@hono/node-server';
import app from './index';

const port = Number(process.env.PORT) || 3000;

console.log(`Amina API running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
