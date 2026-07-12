import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/lib/whoop/auth";
import { prisma, SINGLETON_USER_ID } from "@/lib/db";

// callback from WHOOP get
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("whoop_oauth_state")?.value;

  if (!state || !savedState || state !== savedState) {
    return new Response("Invalid state — possible CSRF attack", { status: 400 });
  }

  if (!code) {
    return new Response("Missing code from WHOOP callback", { status: 400 });
  }

  cookieStore.delete("whoop_oauth_state");

  const tokens = await exchangeCodeForTokens(code);

  const USER_ID = SINGLETON_USER_ID;

  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, name: "Harrison" },
  });

  await prisma.whoopToken.upsert({
    where: { userId: USER_ID },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
    create: {
      userId: USER_ID,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
  });

  redirect("/");
}
