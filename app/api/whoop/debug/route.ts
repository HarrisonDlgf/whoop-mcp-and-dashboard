import type { NextRequest } from "next/server";
import { getLatestRecovery } from "@/lib/whoop/api";
import { isAuthorized } from "@/lib/auth";

// grabs the recovery data 
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const recovery = await getLatestRecovery();
  return Response.json(recovery);
}
