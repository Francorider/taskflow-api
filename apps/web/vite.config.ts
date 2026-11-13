import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const nodeMajor = Number(process.versions.node.split('.')[0]);
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Mirrors the nginx config used in Docker: one origin for the app, the API and its docs.
    proxy: {
      '/api': apiTarget,
      '/docs': apiTarget,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Node 25+ ships its own localStorage global, which would shadow jsdom's.
    execArgv: nodeMajor >= 25 ? ['--no-experimental-webstorage'] : [],
  },
});
