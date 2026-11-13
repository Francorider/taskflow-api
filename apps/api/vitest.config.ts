import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'unit', include: ['test/unit/**/*.test.ts'] },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          globalSetup: ['test/global-setup.ts'],
          // Suites share one database and truncate it between tests, so run files serially.
          fileParallelism: false,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
