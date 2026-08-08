import "server-only";
import { z } from "zod";


const envSchema = z.object({
  
  DATABASE_URL: z.url(),


  APP_SECRET: z.string().min(16),

  CRON_SECRET: z.string().min(16).optional(),

  MCP_HTTP_SECRET: z.string().min(16).optional(),

  // WHOOP OAuth
  WHOOP_CLIENT_ID: z.string().min(1),
  WHOOP_CLIENT_SECRET: z.string().min(1),
  WHOOP_REDIRECT_URI: z.url(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
