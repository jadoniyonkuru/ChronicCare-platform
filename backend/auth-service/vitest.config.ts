import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Generous limits: the first test in a file also pays for loading Nest,
    // which can take several seconds on slow or antivirus-scanned machines.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters',
      // Cheap password hashing and no practical rate limit for tests.
      SCRYPT_LOG_N: '10',
      AUTH_RATE_LIMIT_PER_MINUTE: '1000',
    },
  },
});
