import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { buildAuthUrl } from "@/lib/whoop/auth";

// authorizes and gets cookies from whoop on login
export async function GET() {
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
