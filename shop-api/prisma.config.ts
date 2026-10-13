// Prisma 7 reads its settings from this file instead of schema.prisma + package.json.
// It does not load .env by itself, so we load it here.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `npx prisma db seed` runs this. Prisma 7 no longer seeds automatically after `migrate dev`.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // process.env (not the strict `env()` helper) so `prisma generate` also works
    // before .env exists, e.g. during `npm install`. Migrate commands still require it.
    url: process.env.DATABASE_URL,
  },
});
