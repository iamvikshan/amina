import { defineConfig } from 'vite';
import honox from 'honox/vite';

export default defineConfig({
  plugins: [honox()],
  server: { 
    port: 5173 
  },
  resolve: {
    alias: {
      '@types': '/types',
      '@': '/app',
    },
  },
});
