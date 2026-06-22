import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Prisma 7 talks to Postgres through a driver adapter. PrismaPg wraps the
// node-postgres (`pg`) driver and takes the connection string directly.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Next.js hot-reload re-imports modules on every change, which would spawn a
// new client (and connection pool) each time. Cache one instance on
// globalThis in dev so we reuse it. In production a fresh module = fresh client.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
