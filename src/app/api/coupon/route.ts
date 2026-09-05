/**
 * Coupon validation — a preview for the UI.
 *
 * The request names a TRIP, never a price. Pricing and coupon application both
 * live in lib/pricing.ts, which is also what /api/pay/create charges from — so
 * the figure previewed here and the figure taken at payment cannot drift apart.
 *
 * What comes back is display state. The payment path re-runs quoteTrip()
 * server-side at capture time and treats that as the authority; nothing the
 * browser sends back is trusted.
 */

import { NextResponse } from "next/server";
import { clientIp, publicRateLimit } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/types";
import { quoteTrip } from "@/lib/pricing";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = publicRateLimit(ip, "coupon", 20);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // this endpoint exists to judge a code, so a missing one is a 422 here even
  // though quoteTrip() is happy to price a trip without one
  const code = normalizeCouponCode(String(body.code ?? ""));
  if (!code || code.length > 40) {
    return NextResponse.json({ ok: false, error: "Enter a coupon code." }, { status: 422 });
  }

  const priced = quoteTrip({
    packageSlug: String(body.packageSlug ?? ""),
    citySlug: String(body.citySlug ?? ""),
    occupancy: body.occupancy,
    pax: body.pax,
    code,
  });

  if (!priced.ok) {
    const error =
      priced.status === 409
        ? "This trip is priced on request — talk to us for a code."
        : priced.error;
    return NextResponse.json(
      { ok: false, ...(priced.code ? { code: priced.code } : {}), error },
      { status: priced.status }
    );
  }

  return NextResponse.json({
    ok: true,
    code: priced.coupon?.code ?? code,
    label: priced.coupon?.label ?? "",
    seat: priced.seat,
    pax: priced.pax,
    subtotal: priced.subtotal,
    discount: priced.discount,
    total: priced.total,
  });
}
