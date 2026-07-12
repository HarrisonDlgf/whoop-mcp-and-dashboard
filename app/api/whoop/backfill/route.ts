import type { NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { syncWhoop } from "@/lib/whoop/sync";

export const maxDuration = 60;


export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const daysParam = new URL(request.url).searchParams.get("days") ?? "30";
  const days = Number(daysParam);
  if (!Number.isInteger(days) || days < 1 || days > 180) {
    return new Response("days must be an integer between 1 and 180", {
      status: 400,
    });
  }

  const result = await syncWhoop(days);
  return Response.json(result);
}
