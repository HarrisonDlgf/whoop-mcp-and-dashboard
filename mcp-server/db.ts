import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// loads in the creds and the grabs the connection string from the env file or the environment
try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {
  // .env not found 
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (checked process env and ../.env)");
}

export const SINGLETON_USER_ID = "singleton";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
