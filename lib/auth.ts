import "server-only";
import { timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "app_session";

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // safeguard against an unauthorized request to user's data
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isAuthorized(request: Request): boolean {
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";

  return constantTimeEquals(provided, env.APP_SECRET);
}

export function secretMatches(provided: string | null | undefined): boolean {
  return constantTimeEquals(provided ?? "", env.APP_SECRET);
}

// The cookie holds a hash of APP_SECRET rather than the secret itself, so a
// leaked cookie cannot be replayed against the header/query-param routes.
export function sessionToken(): string {
  return createHash("sha256").update(env.APP_SECRET).digest("hex");
}

export async function hasValidSession(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  return value !== undefined && constantTimeEquals(value, sessionToken());
}
