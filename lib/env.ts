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

  // Single-user gate for v1. Wired in M1; optional until then.
  APP_SECRET: z.string().min(1).optional(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
