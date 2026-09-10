/**
 * The payment summary printed on a booking invoice.
 *
 * Pure: takes an order, returns rows. No catalog, no settings, no I/O — so the
 * arithmetic can be tested on its own, which matters more here than anywhere
 * else on the invoice. Every other section is prose; this one is a claim about
 * money that the customer will check.
 *
 * WHY "Amount payable" EXISTS. The trip total excludes the GST charged on the
 * hold; the amount actually paid includes it. Print those two next to a balance
 * and the column does not reconcile — subtracting one from the other leaves the
 * reader short by exactly the GST. The subtotal is the line that closes it.
 *
 * `kind` carries the arithmetic role, not a style:
 *   row       an addend — the "row" values sum to the payable subtotal
 *   subtotal  derived from the rows above it
 *   deduct    already paid, subtracted from the subtotal
 *   total     what is still owed
 * A renderer that respects those cannot double-subtract the coupon, which is
 * the specific mistake this shape is built to prevent.
 */

import type { Order } from "./orders";

export type InvoiceLineKind = "row" | "subtotal" | "deduct" | "total";

export interface InvoiceLine {
  label: string;
  /** signed: a coupon and the paid amount are negative */
  paise: number;
  kind: InvoiceLineKind;
}

export function invoiceLines(order: Order): InvoiceLine[] {
  const q = order.quote;
  const discountPaise = order.coupon ? Math.round(order.coupon.discount * 100) : 0;
  const lines: InvoiceLine[] = [];

  if (discountPaise > 0 && order.coupon) {
    /* q.totalPaise is ALREADY discounted, so the pre-coupon figure has to be
       rebuilt rather than read. Printing the discounted total above a "− ₹2,500"
       line invites the reader to subtract the discount a second time. */
    lines.push({ label: "Trip price", paise: q.totalPaise + discountPaise, kind: "row" });
    lines.push({ label: `Coupon ${order.coupon.code}`, paise: -discountPaise, kind: "row" });
    lines.push({ label: "Total", paise: q.totalPaise, kind: "subtotal" });
  } else {
    // nothing was taken off, so there is only one total worth naming
    lines.push({ label: "Total", paise: q.totalPaise, kind: "row" });
  }

  if (q.holdGstPaise > 0) {
    lines.push({ label: `GST ${q.gstPercent}% (on hold amount)`, paise: q.holdGstPaise, kind: "row" });
  }

  lines.push({ label: "Amount payable", paise: q.totalPaise + q.holdGstPaise, kind: "subtotal" });
  lines.push({
    // the percentage is read off the frozen quote, never assumed — an order
    // priced when the hold was 5% must keep saying 5% after the admin changes it
    label: `Paid now — (${q.holdPercent}% hold${q.holdGstPaise > 0 ? " + GST" : ""})`,
    paise: q.holdTotalPaise,
    kind: "deduct",
  });
  lines.push({
    /* Read, not derived. GST is tax rather than trip money, so the balance is
       the trip's own two remaining slices — the same figure the return page
       prints as "Balance to pay". */
    label: "Balance due",
    paise: q.advanceBalancePaise + q.departureBalancePaise,
    kind: "total",
  });

  return lines;
}
