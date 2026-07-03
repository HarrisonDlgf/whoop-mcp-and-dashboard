import "server-only";
import { prisma } from "@/lib/db";
import { refreshAccessToken } from "@/lib/whoop/auth";

const WHOOP_API = "https://api.prod.whoop.com/developer/v2";
const USER_ID = "singleton";

// Returns a valid access token, refreshing it first if it's expired.
async function getAccessToken(): Promise<string> {
  const token = await prisma.whoopToken.findUniqueOrThrow({
    where: { userId: USER_ID },
  });

  if (token.expiresAt > new Date()) {
    return token.accessToken;
  }

  // Token is expired — get a new one and save it.
  const refreshed = await refreshAccessToken(token.refreshToken);
  await prisma.whoopToken.update({
    where: { userId: USER_ID },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

// Make an authenticated GET request to the WHOOP API with the token
async function whoopGet(path: string): Promise<unknown> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getLatestRecovery() {
  return whoopGet("/recovery?limit=1");
}
