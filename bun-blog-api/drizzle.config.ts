// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  dialect: "postgresql",
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dbCredentials: {
      url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;