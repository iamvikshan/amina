import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compressor from 'astro-compressor';
import node from '@astrojs/node';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@astrojs/react';
import icon from 'astro-icon';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import site URL from centralized config
import { SITE } from './src/config/site.ts';

export default defineConfig({
  site: SITE.url,
  output: 'server',
  base: '/',
  // Expose CLIENT_ID to the build process (public for bot invite URLs)
  env: {
    schema: {
      CLIENT_ID: {
        context: 'server',
        access: 'public',
        type: 'string',
        optional: true,
        default: '1035629678632915055', // amina fallback
      },
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4321,
    host: true,
  },
  adapter: node({ mode: 'standalone' }),
  image: {
    domains: ['images.unsplash.com'],
    // Enable image optimization caching
    remotePatterns: [{ protocol: 'https' }],
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    react(),
    icon(),
    tailwind(),
    sitemap(),
    compressor({ gzip: true, brotli: true }),
  ],
  vite: {
    build: {
      cssMinify: true,
      minify: true,
      // Enable code splitting for better caching
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('lucide')) return 'vendor-icons';
              return 'vendor';
            }
          },
        },
      },
    },

    envDir: path.resolve(__dirname, '..'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@content': path.resolve(__dirname, './src/content'),
        '@config': path.resolve(__dirname, './src/config'),
        '@images': path.resolve(__dirname, './src/images'),
        '@scripts': path.resolve(__dirname, './src/assets/scripts'),
        '@styles': path.resolve(__dirname, './src/assets/styles'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@root': path.resolve(__dirname, '..'),
      },
    },
  },
});
