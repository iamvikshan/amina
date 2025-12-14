import { defineConfig } from 'vite';
import honox from 'honox/vite';
import build from '@hono/vite-build/bun';

export default defineConfig({
  define: {
    'process.env': 'process.env',
  },
  ssr: {
    // Prevent Vite's SSR runner from inlining/transpiling mongoose.
    // When inlined, mongoose's CommonJS `require(...)` calls can execute
    // in an ESM sandbox where `require` is undefined, crashing SSR.
    external: ['mongoose'],
  },
  plugins: [
    honox({
      client: {
        input: ['/app/client.ts'],
      },
    }),
    build(),
  ],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@types': '/types',
      '@': '/app',
    },
  },
});
