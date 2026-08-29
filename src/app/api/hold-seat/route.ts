import { NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";

/**
 * Placeholder "Hold My Seat" endpoint.
 * Swap the body of this handler for the real inventory/CRM call — the
 * response contract below is what the frontend expects.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "hold", 8);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.phone || !body?.trip) {
    return NextResponse.json(
      { ok: false, error: "name, phone and trip are required" },
      { status: 400 }
    );
  }

  // simulate inventory lock latency
  await new Promise((r) => setTimeout(r, 650));

  return NextResponse.json({
    ok: true,
    holdId: `HOLD-${String(body.trip).toUpperCase()}-${Date.now().toString(36)}`,
    trip: body.trip,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}
