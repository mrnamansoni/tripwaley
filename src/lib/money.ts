/**
 * Money for the seat-hold payment.
 *
 * Tripwaley collects in three stages, and only the first one happens online:
 *
 *   1. the website charges holdPercent of the trip total, plus gstPercent GST
 *      ON THAT HOLD — this is what goes to PhonePe, and it holds the seat
 *   2. the team collects the rest of the advance offline, up to advancePercent
 *      of the total — this is what confirms the booking
 *   3. the balance is paid at departure
 *
 * Everything here is an INTEGER NUMBER OF PAISE, rounded once per step and
 * never carried between steps as a float. Two reasons, both real:
 *
 *   • PhonePe's amount field is integer paise. A float that arrives as
 *     44619.999999 has to be coerced somewhere, and the somewhere is usually
 *     wrong by a paisa — which then fails reconciliation against the
 *     settlement report.
 *   • the charge is a percentage OF a percentage. 5% of 5% of ₹8,499 is
 *     ₹21.2475, and the drift compounds if each step keeps its fraction.
 *
 * This module deliberately imports nothing: it is pure arithmetic, so it can be
 * exercised directly by scripts/test-money.mjs without pulling in the catalog.
 */

/** PhonePe rejects any order below 100 paise (₹1). */
export const PHONEPE_MIN_PAISE = 100;

export interface HoldQuoteInput {
  /** trip total in whole rupees, AFTER any coupon — priced server-side */
  total: number;
  holdPercent: number;
  gstPercent: number;
  advancePercent: number;
}

export interface HoldQuote {
  totalPaise: number;
  /** the bare holdPercent slice — this is what counts toward the advance */
  holdBasePaise: number;
  holdGstPaise: number;
  /** what the customer is actually charged online */
  holdTotalPaise: number;
  advanceTotalPaise: number;
  /** still to collect offline to reach the advance (GST is tax, not advance) */
  advanceBalancePaise: number;
  departureBalancePaise: number;
  /** the percentages actually used, after clamping */
  holdPercent: number;
  gstPercent: number;
  advancePercent: number;
  /** false when there is nothing chargeable, or the charge is under PhonePe's floor */
  chargeable: boolean;
}

const ZERO_QUOTE = (holdPercent: number, gstPercent: number, advancePercent: number): HoldQuote => ({
  totalPaise: 0,
  holdBasePaise: 0,
  holdGstPaise: 0,
  holdTotalPaise: 0,
  advanceTotalPaise: 0,
  advanceBalancePaise: 0,
  departureBalancePaise: 0,
  holdPercent,
  gstPercent,
  advancePercent,
  chargeable: false,
});

/** a percentage we are willing to multiply money by */
function pct(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** one rounding, on integers, at the point of use */
function slice(paise: number, percent: number): number {
  return Math.round((paise * percent) / 100);
}

export function holdQuote(input: HoldQuoteInput): HoldQuote {
  const holdPercent = pct(input.holdPercent);
  const gstPercent = pct(input.gstPercent);
  const advancePercent = pct(input.advancePercent);

  const total = Number(input.total);
  if (!Number.isFinite(total) || total <= 0) {
    return ZERO_QUOTE(holdPercent, gstPercent, advancePercent);
  }

  const totalPaise = Math.round(total * 100);

  const holdBasePaise = slice(totalPaise, holdPercent);
  const holdGstPaise = slice(holdBasePaise, gstPercent);
  const holdTotalPaise = holdBasePaise + holdGstPaise;

  const advanceTotalPaise = slice(totalPaise, advancePercent);

  return {
    totalPaise,
    holdBasePaise,
    holdGstPaise,
    holdTotalPaise,
    advanceTotalPaise,
    // the hold BASE counts toward the advance; the GST on it does not — it is
    // tax collected on the fee, not money the traveller has put against the trip
    advanceBalancePaise: advanceTotalPaise - holdBasePaise,
    departureBalancePaise: totalPaise - advanceTotalPaise,
    holdPercent,
    gstPercent,
    advancePercent,
    chargeable: holdTotalPaise >= PHONEPE_MIN_PAISE,
  };
}

/** ₹945 · ₹446.20 · ₹14,400 — whole rupees drop the decimals. */
export function formatPaise(paise: number): string {
  if (!Number.isFinite(paise)) return "₹0";
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

/** paise → whole rupees, for the places that still speak in rupees */
export function toRupees(paise: number): number {
  return Number.isFinite(paise) ? paise / 100 : 0;
}

/**
 * The per-seat rate BEFORE any coupon, for the CRM's money block.
 *
 * An order freezes `quote.totalPaise`, which is the DISCOUNTED total. Deriving
 * a seat price from that and handing it to the webhook made the payload report
 * a post-discount `subtotal` beside a separate `discount`, so subtotal minus
 * discount equalled neither the gross nor the net — ₹8,075 − ₹425 = ₹7,650 on a
 * trip that cost ₹8,500 before the coupon and ₹8,075 after. Any CRM field
 * mapped to `subtotal` as gross revenue under-reported by the discount.
 *
 * Orders written since then store the real pre-coupon rate; older ones have to
 * add the discount back, which is exact because the discount is frozen too.
 */
export function preCouponSeatPrice(o: {
  /** the DISCOUNTED total frozen on the order */
  totalPaise: number;
  /** rupees off, from the coupon frozen on the order */
  couponDiscount?: number | null;
  pax?: number | null;
  /** the rate stored at order creation — authoritative when present */
  stored?: number | null;
}): number | null {
  if (o.stored != null && Number.isFinite(o.stored)) return o.stored;
  const pax = o.pax && o.pax > 0 ? o.pax : 1;
  const total = Number(o.totalPaise);
  if (!Number.isFinite(total) || total <= 0) return null;
  const discountPaise = Math.round(Number(o.couponDiscount ?? 0) * 100) || 0;
  return (total + discountPaise) / 100 / pax;
}
