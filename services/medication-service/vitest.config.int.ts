import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Pick up TEST_DATABASE_URL from .env locally; CI sets it directly.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.int-spec.ts'],
    // Test files share one database, so run them one at a time.
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
