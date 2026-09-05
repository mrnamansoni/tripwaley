import { findCoupon, getPackage, priceFor } from "./catalog";
import { applyCoupon, COUPON_ERROR, normalizeCouponCode, packageCategories } from "./types";
import type { Package } from "./types";

/**
 * Server-side trip pricing — the one place a rupee figure is decided.
 *
 * Both /api/coupon (which previews a discount) and /api/pay/create (which
 * charges for it) route through here. They used to be separate, and separate
 * is dangerous: if the two ever computed a total differently, the site would
 * quote one price and take another, which is the single worst bug a booking
 * flow can have. One function, one answer.
 *
 * The caller names a TRIP, never a price. The rate is looked up in the catalog
 * and the coupon applied to the server's own total, so a tampered request body
 * cannot manufacture a discount or mint an arbitrary "total" to be charged.
 */

/** today in IST as yyyy-mm-dd — coupon expiry is a business date, not a UTC instant */
export function istToday(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60_000);
  return ist.toISOString().slice(0, 10);
}

export interface PriceRequest {
  packageSlug: string;
  citySlug: string;
  occupancy?: unknown;
  pax?: unknown;
  /** optional; an invalid one is reported, never silently ignored */
  code?: unknown;
}

export interface PricedTrip {
  ok: true;
  pkg: Package;
  occupancy: "double" | "triple";
  pax: number;
  seat: number;
  /** seat * pax, before any coupon */
  subtotal: number;
  discount: number;
  /** what the trip actually costs — subtotal minus discount */
  total: number;
  coupon?: { code: string; label: string; discount: number };
}

export interface PriceFailure {
  ok: false;
  /** http status the caller should use */
  status: number;
  error: string;
  /** set when the trip priced fine but the CODE was the problem */
  couponRejected?: boolean;
  code?: string;
}

export type PriceResult = PricedTrip | PriceFailure;

/** clamp pax the same way everywhere: 1–20 whole travellers */
export function normalizePax(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(20, Math.max(1, Math.round(n))) : 1;
}

export function normalizeOccupancy(raw: unknown): "double" | "triple" {
  return raw === "double" ? "double" : "triple";
}

export function quoteTrip(req: PriceRequest): PriceResult {
  const packageSlug = String(req.packageSlug ?? "");
  const citySlug = String(req.citySlug ?? "");
  const occupancy = normalizeOccupancy(req.occupancy);
  const pax = normalizePax(req.pax);

  const pkg = getPackage(packageSlug);
  if (!pkg) return { ok: false, status: 400, error: "Unknown trip." };

  const rule = priceFor(packageSlug, citySlug);
  const seat = rule?.[occupancy] ?? rule?.triple ?? rule?.double;
  if (seat == null) {
    return {
      ok: false,
      status: 409,
      error: "This trip is priced on request — talk to us for a quote.",
    };
  }

  const subtotal = seat * pax;

  const rawCode = req.code == null ? "" : String(req.code);
  if (!rawCode.trim()) {
    return { ok: true, pkg, occupancy, pax, seat, subtotal, discount: 0, total: subtotal };
  }

  const code = normalizeCouponCode(rawCode);
  if (!code || code.length > 40) {
    return { ok: false, status: 422, error: "Enter a coupon code.", couponRejected: true };
  }

  const result = applyCoupon(findCoupon(code), {
    total: subtotal,
    packageSlug,
    categories: packageCategories(pkg),
    today: istToday(),
  });

  if (!result.ok) {
    return {
      ok: false,
      status: 200, // a wrong coupon is a normal outcome, not a request failure
      error: COUPON_ERROR[result.reason ?? "unknown"],
      couponRejected: true,
      code,
    };
  }

  return {
    ok: true,
    pkg,
    occupancy,
    pax,
    seat,
    subtotal,
    discount: result.discount,
    total: result.total,
    coupon: { code: result.code ?? code, label: result.label ?? "", discount: result.discount },
  };
}
