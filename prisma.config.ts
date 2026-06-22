import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads CLI config from here instead of package.json. Once this file
// exists, the CLI no longer auto-loads .env, so we import dotenv/config above.
type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});
