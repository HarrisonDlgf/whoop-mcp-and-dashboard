import { NextResponse } from "next/server";
import { SESSION_COOKIE, secretMatches, sessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!secretMatches(url.searchParams.get("secret"))) {
    return new Response("Not found", { status: 404 });
  }

  const response = NextResponse.redirect(new URL("/dashboard", url.origin));
  response.cookies.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
