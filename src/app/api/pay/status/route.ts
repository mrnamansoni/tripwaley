import { NextRequest, NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { refreshFromPhonePe } from "@/lib/settle";
import { formatPaise } from "@/lib/money";

/**
 * Poll one order's status.
 *
 * A UPI collect can sit PENDING for up to a couple of minutes while the
 * customer opens their bank app, so the return page polls this rather than
 * declaring failure on the first look.
 *
 * Only ever returns the order's own outcome — no contact details, no other
 * orders — because the order id travels in a URL and is not a secret.
 */

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "paystatus", 40);
  if (limit.blocked) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 30) } }
    );
  }

  const id = req.nextUrl.searchParams.get("order") ?? "";
  if (!id || !getOrder(id)) {
    return NextResponse.json({ ok: false, error: "Unknown order." }, { status: 404 });
  }

  try {
    const settled = await refreshFromPhonePe(id);
    if (!settled) return NextResponse.json({ ok: false, error: "Unknown order." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      status: settled.order.status,
      amountLabel: formatPaise(settled.order.quote.holdTotalPaise),
    });
  } catch {
    // gateway hiccup — report the stored state rather than inventing a failure
    const order = getOrder(id);
    return NextResponse.json({
      ok: true,
      status: order?.status ?? "created",
      amountLabel: formatPaise(order?.quote.holdTotalPaise ?? 0),
      stale: true,
    });
  }
}
