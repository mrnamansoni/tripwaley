import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookAuth } from "@/lib/phonepe";
import { applyStatus } from "@/lib/settle";

/**
 * PhonePe's server-to-server callback.
 *
 * This is what saves the booking when the customer pays and then closes the
 * tab, loses signal, or approves a UPI collect twenty minutes later — cases
 * where the browser never comes back to /pay/return and nothing else would
 * ever mark the order paid.
 *
 * Authentication is SHA256(username:password) in the Authorization header,
 * using credentials set on the PhonePe dashboard's Webhooks tab and mirrored
 * into PHONEPE_WEBHOOK_USER / PHONEPE_WEBHOOK_PASS. An unverified callback is
 * discarded — the Order Status API remains the authority either way.
 */

export async function POST(req: NextRequest) {
  if (!verifyWebhookAuth(req.headers.get("authorization"))) {
    console.warn("[pay/webhook] rejected an unverified callback");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = (body.payload ?? {}) as Record<string, unknown>;
  const id = String(payload.merchantOrderId ?? "");
  if (!id) {
    console.warn("[pay/webhook] callback carried no merchantOrderId:", body.event);
    return NextResponse.json({ ok: true });
  }

  const details = Array.isArray(payload.paymentDetails) ? payload.paymentDetails[0] : undefined;
  const settled = applyStatus(id, {
    state: String(payload.state ?? ""),
    amount: Number(payload.amount) || 0,
    orderId: payload.orderId ? String(payload.orderId) : undefined,
    transactionId: details?.transactionId ? String(details.transactionId) : undefined,
    paymentMode: details?.paymentMode ? String(details.paymentMode) : undefined,
    errorCode: payload.errorCode ? String(payload.errorCode) : undefined,
  });

  if (!settled) {
    // an id we've never issued: log it and still 200, or PhonePe will retry forever
    console.warn("[pay/webhook] unknown order:", id);
    return NextResponse.json({ ok: true });
  }

  console.log(`[pay/webhook] ${body.event} → ${id} is ${settled.order.status}`);
  // always acknowledge; a non-2xx puts PhonePe into a retry loop
  return NextResponse.json({ ok: true });
}
