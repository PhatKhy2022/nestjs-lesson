import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json (e.g. the ones `nest g library` adds).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true, // describe/it/expect/vi without importing them
    root: './',
    include: ['**/*.spec.ts'],
  },
});
