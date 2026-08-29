import { NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";

/**
 * Placeholder "Pay Token & Book" endpoint.
 * In production this creates a payment order (Razorpay/Cashfree) and returns
 * the checkout payload; the frontend already handles ok/paymentUrl.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "token", 8);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.trip) {
    return NextResponse.json({ ok: false, error: "trip is required" }, { status: 400 });
  }

  // simulate order creation latency
  await new Promise((r) => setTimeout(r, 800));

  return NextResponse.json({
    ok: true,
    orderId: `TOKEN-${String(body.trip).toUpperCase()}-${Date.now().toString(36)}`,
    amount: body.amount ?? 2000,
    currency: "INR",
    paymentUrl: "#placeholder-checkout",
  });
}
