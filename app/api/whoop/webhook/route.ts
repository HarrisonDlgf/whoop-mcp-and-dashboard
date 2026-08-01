import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// every whoop post has a timestamp and header with a unique identifier, this will recreate and make sure no outside sources can
// touch my WHOOP data
function isValidSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!signature || !timestamp) return false;

  // Hmac is the same format WHOOP uses, store the client secret in env and pul here
  const expected = createHmac("sha256", env.WHOOP_CLIENT_SECRET)
    .update(timestamp + rawBody)
    .digest();

  // de-encrypt the buffer 
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  // compare the two 
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("X-WHOOP-Signature");
  const timestamp = request.headers.get("X-WHOOP-Signature-Timestamp");

  if (!isValidSignature(rawBody, signature, timestamp)) {
    console.warn("[whoop webhook] rejected: bad or missing signature");
    return new Response("invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  console.log("[whoop webhook] verified:", event);

  const { type, id } = event;
  switch (type) {
    case "sleep.updated": break;
    case "workout.updated": break;
    case "recovery.updated": break;
    case "sleep.deleted":
    case "workout.deleted":
    case "recovery.deleted": break;
  }
  return new Response("ok", { status: 200 });
}
