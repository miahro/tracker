// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Point @trail-tracker/domain at source directly — no build step needed for tests
      '@trail-tracker/domain': new URL('domain/src/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['domain/src/**/*.test.ts', 'web/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
    },
  },
})
