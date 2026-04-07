import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'shared/**/*.test.ts',
      'apps/mobile/src/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.ignored/**',
      '**/dist/**',
      '**/.expo/**',
      '**/app_backup/**',
    ],
  },
});
