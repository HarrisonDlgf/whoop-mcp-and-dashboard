import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { buildAuthUrl } from "@/lib/whoop/auth";
import { hasValidSession } from "@/lib/auth";

// authorizes and gets cookies from whoop on login
export async function GET() {
  if (!(await hasValidSession())) {
    return new Response("Not found", { status: 404 });
  }

  const { url, state } = buildAuthUrl();

  const cookieStore = await cookies();
  cookieStore.set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  redirect(url);
}
