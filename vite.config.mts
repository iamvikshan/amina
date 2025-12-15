import { defineConfig } from 'vite';
import honox from 'honox/vite';
import build from '@hono/vite-build/bun';

export default defineConfig({
  define: {
    'process.env': 'process.env',
  },
  ssr: {
    // Prevent Vite's SSR runner from inlining/transpiling mongodb.
    // When inlined, mongodb's CommonJS entry can run in an ESM sandbox where
    // `exports` is undefined, crashing SSR.
    external: ['mongodb'],
  },
  plugins: [
    honox({
      client: {
        input: [
          '/app/client.ts', // the default value -> must be added if input is overridden
          '/app/assets/styles/global.css', // add the style file entrypoint
        ],
      },
    }),
    build(),
  ],
  server: {
    port: 4321,
  },
  resolve: {
    alias: {
      '@types': '/types',
      '@': '/app',
      '@lib': '/app/lib',
      '@utils': '/app/utils',
      '@config': '/app/config',
      '@components': '/app/components',
      '@styles': '/app/assets/styles',
    },
  },
});
