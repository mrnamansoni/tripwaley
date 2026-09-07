import { getOrder, updateOrder, type Order } from "./orders";
import { orderStatus } from "./phonepe";
import { formatPaise, preCouponSeatPrice } from "./money";
import { getPackage } from "./catalog";
import { buildPaymentEvent } from "./webhookPayload";
import { sendToCrm, withCreatorName } from "./webhooks";

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
  const pkg = getPackage(order.packageSlug);
  const paxSafe = order.pax || 1;

  // pre-coupon, so the CRM's subtotal - discount === tripTotal actually holds
  const seatPrice = preCouponSeatPrice({
    totalPaise: order.quote.totalPaise,
    couponDiscount: order.coupon?.discount,
    pax: paxSafe,
    stored: order.seatPrice,
  });

  sendToCrm(
    withCreatorName(buildPaymentEvent({
      id: order.id,
      name: order.contact.name,
      phone: order.contact.phone,
      packageSlug: order.packageSlug,
      packageName: order.packageName,
      packageCode: pkg?.code ?? "",
      destination: pkg?.destination ?? "",
      nights: pkg?.nights ?? null,
      date: order.date,
      citySlug: order.citySlug,
      cityName: order.cityName,
      occupancy: order.occupancy,
      pax: paxSafe,
      seatPrice,
      coupon: order.coupon ?? null,
      source: order.source,
      quote: order.quote,
      payment: {
        status: order.status,
        orderId: order.id,
        gatewayOrderId: order.phonepe?.orderId ?? null,
        transactionId: order.phonepe?.transactionId ?? null,
        method: order.phonepe?.paymentMode ?? null,
        paidAt: order.paidAt ?? null,
      },
    }))
  );
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
