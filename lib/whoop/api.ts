import "server-only";
import { prisma, SINGLETON_USER_ID } from "@/lib/db";
import { refreshAccessToken } from "@/lib/whoop/auth";
import type {
  CollectionPage,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
} from "@/lib/whoop/types";

const WHOOP_API = "https://api.prod.whoop.com/developer/v2";
const USER_ID = SINGLETON_USER_ID;

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

async function whoopCollection<T>(path: string, start: Date): Promise<T[]> {
  const records: T[] = [];
  let nextToken: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "25",
      start: start.toISOString(),
    });
    if (nextToken) params.set("nextToken", nextToken);

    const page = (await whoopGet(`${path}?${params}`)) as CollectionPage<T>;
    records.push(...page.records);
    nextToken = page.next_token ?? undefined;
  } while (nextToken);

  return records;
}

export function getRecoveries(start: Date) {
  return whoopCollection<WhoopRecovery>("/recovery", start);
}

export function getSleeps(start: Date) {
  return whoopCollection<WhoopSleep>("/activity/sleep", start);
}

export function getWorkouts(start: Date) {
  return whoopCollection<WhoopWorkout>("/activity/workout", start);
}

export async function getSleepById(id: string): Promise<WhoopSleep> {
  return (await whoopGet(`/activity/sleep/${id}`)) as WhoopSleep;
}

export async function getWorkoutById(id: string): Promise<WhoopWorkout> {
  return (await whoopGet(`/activity/workout/${id}`)) as WhoopWorkout;
}
