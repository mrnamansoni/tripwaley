import { getOrder, updateOrder, type Order } from "./orders";
import { orderStatus } from "./phonepe";
import { formatPaise } from "./money";

/**
 * Turning a PhonePe status into a settled order.
 *
 * Three different things ask "did this get paid?" — the return page, the status
 * poller the return page uses while a UPI collect is still pending, and the
 * server-to-server webhook. They must all reach the same verdict by the same
 * rule, so the rule lives here once.
 *
 * The rule: an order is paid when PhonePe says COMPLETED **and** the amount it
 * reports equals the paise figure frozen on the order at creation. The amount
 * check is not paranoia — without it, the only thing standing between you and
 * a confirmed booking is control of a URL.
 */

export type Settlement = { order: Order; changed: boolean; reason?: string };

/** notify ops exactly once, when an order first becomes paid */
function notifyOps(order: Order) {
  const hook = process.env.TW_BOOKING_WEBHOOK;
  const payload = {
    event: "seat_hold_paid",
    bookingId: order.id,
    paidAt: order.paidAt,
    package: { slug: order.packageSlug, name: order.packageName },
    fromCity: { slug: order.citySlug, name: order.cityName },
    date: order.date,
    occupancy: order.occupancy,
    pax: order.pax,
    coupon: order.coupon ?? null,
    money: {
      currency: "INR",
      tripTotal: order.quote.totalPaise / 100,
      paidNow: order.quote.holdTotalPaise / 100,
      holdBase: order.quote.holdBasePaise / 100,
      gst: order.quote.holdGstPaise / 100,
      /* what the team still has to collect to reach the confirming advance */
      advanceStillDue: order.quote.advanceBalancePaise / 100,
      dueAtDeparture: order.quote.departureBalancePaise / 100,
    },
    contact: order.contact,
    phonepe: order.phonepe ?? null,
    source: "website-hold",
  };

  if (!hook) {
    console.log("[settle] paid (no webhook configured):", JSON.stringify(payload));
    return;
  }
  // fire-and-forget: a CRM hiccup must never affect what the traveller sees
  fetch(hook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(4000),
  }).catch((e) => console.error("[settle] ops webhook failed:", e?.message));
}

interface StatusFacts {
  state: string;
  amount: number;
  orderId?: string;
  transactionId?: string;
  paymentMode?: string;
  errorCode?: string;
}

/**
 * Apply a set of status facts to a stored order.
 * Shared by the polled path and the webhook path, which carry the same fields.
 */
export function applyStatus(id: string, facts: StatusFacts): Settlement | undefined {
  const existing = getOrder(id);
  if (!existing) return undefined;

  // already settled — record any new detail but never re-notify or downgrade
  if (existing.status === "paid") {
    const order = updateOrder(id, {
      phonepe: {
        state: facts.state,
        orderId: facts.orderId,
        transactionId: facts.transactionId,
        paymentMode: facts.paymentMode,
      },
    });
    return { order: order ?? existing, changed: false };
  }

  const state = (facts.state || "").toUpperCase();

  if (state === "COMPLETED") {
    // the amount PhonePe settled must be the amount we priced. A mismatch is
    // never "close enough" — it is either tampering or a genuine gateway
    // discrepancy, and both need a human, not an automatic confirmation.
    if (facts.amount !== existing.quote.holdTotalPaise) {
      const order = updateOrder(id, {
        status: "failed",
        phonepe: {
          state: "AMOUNT_MISMATCH",
          orderId: facts.orderId,
          transactionId: facts.transactionId,
          errorCode: `expected ${existing.quote.holdTotalPaise}p, got ${facts.amount}p`,
        },
      });
      console.error(
        `[settle] AMOUNT MISMATCH on ${id}: expected ${formatPaise(existing.quote.holdTotalPaise)}, PhonePe reported ${formatPaise(facts.amount)}`
      );
      return { order: order ?? existing, changed: true, reason: "amount-mismatch" };
    }

    const order = updateOrder(id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      phonepe: {
        state,
        orderId: facts.orderId,
        transactionId: facts.transactionId,
        paymentMode: facts.paymentMode,
      },
    });
    if (order) notifyOps(order);
    return { order: order ?? existing, changed: true };
  }

  if (state === "FAILED") {
    const order = updateOrder(id, {
      status: "failed",
      phonepe: { state, orderId: facts.orderId, transactionId: facts.transactionId, errorCode: facts.errorCode },
    });
    return { order: order ?? existing, changed: true, reason: facts.errorCode };
  }

  // PENDING — a UPI collect the customer hasn't approved yet. Leave it alone.
  const order = updateOrder(id, {
    phonepe: { state, orderId: facts.orderId, transactionId: facts.transactionId },
  });
  return { order: order ?? existing, changed: false };
}

/** Ask PhonePe directly, then settle. Used by the return page and the poller. */
export async function refreshFromPhonePe(id: string): Promise<Settlement | undefined> {
  const existing = getOrder(id);
  if (!existing) return undefined;

  // nothing to learn about an order already settled as paid
  if (existing.status === "paid") return { order: existing, changed: false };

  const status = await orderStatus(id);
  return applyStatus(id, {
    state: status.state,
    amount: status.amount,
    orderId: status.orderId,
    transactionId: status.transactionId,
    paymentMode: status.paymentMode,
    errorCode: status.errorCode,
  });
}
