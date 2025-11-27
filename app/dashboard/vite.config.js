import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util'],
      globals: {
        Buffer: true,
        process: true
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});

