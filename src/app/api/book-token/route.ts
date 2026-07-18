import { NextResponse } from "next/server";

/**
 * Placeholder "Pay Token & Book" endpoint.
 * In production this creates a payment order (Razorpay/Cashfree) and returns
 * the checkout payload; the frontend already handles ok/paymentUrl.
 */
export async function POST(req: Request) {
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
