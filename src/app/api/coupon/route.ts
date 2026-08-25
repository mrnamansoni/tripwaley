/**
 * Coupon validation.
 *
 * The request names a TRIP, never a price. The server looks the rate up in
 * the catalog, computes the total itself and only then applies the code —
 * so a tampered body can't manufacture a discount, and this endpoint can't
 * be used as an oracle to mint arbitrary "totals".
 *
 * What comes back is a preview for the UI. The booking/payment path must
 * re-run applyCoupon() server-side at capture time and treat that as the
 * authority; anything the browser sends back is display state only.
 */

import { NextResponse } from "next/server";
import { findCoupon, getPackage, priceFor } from "@/lib/catalog";
import { applyCoupon, COUPON_ERROR, normalizeCouponCode, packageCategories } from "@/lib/types";

/** today in IST as yyyy-mm-dd — expiry is a business date, not a UTC instant */
function istToday(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60_000);
  return ist.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const code = normalizeCouponCode(String(body.code ?? ""));
  if (!code || code.length > 40) {
    return NextResponse.json({ ok: false, error: "Enter a coupon code." }, { status: 422 });
  }

  const packageSlug = String(body.packageSlug ?? "");
  const citySlug = String(body.citySlug ?? "");
  const occupancy = body.occupancy === "double" ? "double" : "triple";
  const paxRaw = Number(body.pax);
  const pax = Number.isFinite(paxRaw) ? Math.min(20, Math.max(1, Math.round(paxRaw))) : 1;

  const pkg = getPackage(packageSlug);
  if (!pkg) {
    return NextResponse.json({ ok: false, error: "Unknown trip." }, { status: 400 });
  }

  const rule = priceFor(packageSlug, citySlug);
  const seat = rule?.[occupancy] ?? rule?.triple ?? rule?.double;
  if (seat == null) {
    return NextResponse.json(
      { ok: false, error: "This trip is priced on request — talk to us for a code." },
      { status: 409 }
    );
  }

  const total = seat * pax;
  const result = applyCoupon(findCoupon(code), {
    total,
    packageSlug,
    categories: packageCategories(pkg),
    today: istToday(),
  });

  if (!result.ok) {
    // 200 with ok:false — a wrong coupon is a normal outcome, not a failure,
    // and the UI wants the reason text either way
    return NextResponse.json({
      ok: false,
      code,
      error: COUPON_ERROR[result.reason ?? "unknown"],
    });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    label: result.label,
    seat,
    pax,
    subtotal: total,
    discount: result.discount,
    total: result.total,
  });
}
