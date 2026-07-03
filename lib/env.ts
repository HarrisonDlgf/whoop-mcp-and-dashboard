import "server-only";
import { z } from "zod";

// Validate environment variables once, at startup. Importing `env` anywhere
// gives you a typed, guaranteed-present object — never reach for process.env
// directly in app code. `server-only` makes the build fail if this file is
// ever pulled into a client component, keeping secrets server-side.
const envSchema = z.object({
  // Postgres (Neon). Use the DIRECT (unpooled) connection string — for a
  // single-user app it's simplest and avoids pooler/migration friction.
  DATABASE_URL: z.url(),

  // Single-user gate for v1. Required: protected routes compare against it.
  APP_SECRET: z.string().min(16),

  // WHOOP OAuth
  WHOOP_CLIENT_ID: z.string().min(1),
  WHOOP_CLIENT_SECRET: z.string().min(1),
  WHOOP_REDIRECT_URI: z.url(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
