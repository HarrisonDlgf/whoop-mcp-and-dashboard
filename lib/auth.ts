import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function isAuthorized(request: Request): boolean {
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";

  const a = Buffer.from(provided);
  const b = Buffer.from(env.APP_SECRET);
  // safeguard against an unauthorized request to user's data
  return a.length === b.length && timingSafeEqual(a, b);
}
