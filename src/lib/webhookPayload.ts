/**
 * The CRM webhook payload.
 *
 * One envelope for every event, built to be mapped in n8n without expressions.
 * Two rules shape everything below, and both exist because of how n8n fails:
 *
 *   1. EVERY PATH IS PRESENT ON EVERY EVENT. A mapping references
 *      `money.couponCode`; if that path vanishes on a booking without a coupon,
 *      the node errors and the record never reaches the CRM. Absent values are
 *      null, never missing.
 *
 *   2. EVERY LEAF IS A SCALAR. A nullable nested object is rule 1's trap in
 *      disguise — `money.coupon.code` exists on one event and not the next. So
 *      coupon and UTM fields are flat, and `payment` is always a full object
 *      with null members rather than sometimes null.
 *
 * Money appears twice throughout: rupees for humans and CRM currency fields,
 * integer paise beside it for anything that has to reconcile exactly against
 * PhonePe's settlement report.
 *
 * Deliberately imports nothing, so scripts/test-webhooks.mjs can exercise it
 * directly and so it can never accidentally pull the catalog into a payload.
 */

export const SCHEMA_VERSION = 1;

/** the top-level keys every event carries — asserted by the tests */
export const EVENT_KEYS = [
  "event", "eventId", "schemaVersion", "occurredAt", "environment",
  "contact", "trip", "money", "source", "payment", "crm", "links",
] as const;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tripwaley.com").replace(/\/+$/, "");

/* ------------------------------------------------------------------ source */

export interface LeadSource {
  page?: string;
  surface?: string;
  creator?: string | null;
  creatorName?: string | null;
  packageSlug?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}

/** hostnames we accept a Referer from when reconciling attribution */
function isOwnHost(host: string): boolean {
  const own = new Set(["tripwaley.com", "www.tripwaley.com", "localhost"]);
  try {
    own.add(new URL(SITE).hostname);
  } catch {
    /* SITE misconfigured — the literals above still apply */
  }
  return own.has(host);
}

/**
 * Reconcile the client's claim about where a lead came from against the
 * Referer header.
 *
 * The browser supplies `page` because it knows the route; the header is the
 * independent witness. They normally agree. When they disagree the header
 * wins, because a page value is trivially editable and attribution that can be
 * rewritten by the visitor is worth nothing. An OFF-SITE referer is ignored
 * rather than trusted — otherwise an inbound link could overwrite the page.
 */
export function resolveSource(client: LeadSource | undefined, referer: string | null): Required<LeadSource> {
  let fromHeader: string | null = null;
  if (referer) {
    try {
      const u = new URL(referer);
      if (isOwnHost(u.hostname)) fromHeader = u.pathname;
    } catch {
      /* unparseable Referer — ignore it entirely */
    }
  }

  const claimed = (client?.page ?? "").trim();
  const page = fromHeader && claimed && fromHeader !== claimed ? fromHeader : claimed || fromHeader || "/";

  return {
    page,
    surface: (client?.surface ?? "").trim() || "unknown",
    creator: client?.creator || null,
    creatorName: client?.creatorName || null,
    packageSlug: client?.packageSlug || null,
    referrer: referer || null,
    utmSource: client?.utmSource || null,
    utmMedium: client?.utmMedium || null,
    utmCampaign: client?.utmCampaign || null,
    utmContent: client?.utmContent || null,
    utmTerm: client?.utmTerm || null,
  };
}

/* ------------------------------------------------------------- primitives */

const rupees = (paise: number | null | undefined): number | null =>
  paise == null || !Number.isFinite(paise) ? null : paise / 100;

const paiseOf = (rs: number | null | undefined): number | null =>
  rs == null || !Number.isFinite(rs) ? null : Math.round(rs * 100);

const nz = (v: string | null | undefined): string | null => {
  const s = (v ?? "").trim();
  return s || null;
};

/** "2026-10-26" → "Mon, 26 Oct" — kept local so this module imports nothing */
function dateLabel(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${day}, ${d.getUTCDate()} ${mon}`;
}

/** a week before departure — when the team collects the rest of the advance */
function expectedClose(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

const tenDigits = (phone: string): string => (phone ?? "").replace(/\D/g, "").slice(-10);

/** every dot-path leaf, so the tests can prove no path ever disappears */
export function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k)
  );
}

/* ---------------------------------------------------------------- inputs */

export interface EventInput {
  /** lead id or order id — makes eventId stable across retries */
  id: string;
  name?: string;
  phone: string;
  email?: string | null;

  packageSlug?: string;
  packageName?: string;
  packageCode?: string;
  destination?: string;
  nights?: number | null;
  date?: string;
  citySlug?: string;
  cityName?: string;
  occupancy?: string;
  pax?: number;
  /** per-seat rupees, before any coupon */
  seatPrice?: number | null;

  coupon?: { code: string; label: string; discount: number } | null;
  source?: LeadSource;
}

export interface PaymentInput extends EventInput {
  quote: {
    totalPaise: number;
    holdBasePaise: number;
    holdGstPaise: number;
    holdTotalPaise: number;
    advanceBalancePaise: number;
    departureBalancePaise: number;
    holdPercent: number;
    gstPercent: number;
    advancePercent: number;
  };
  payment: {
    status: string;
    orderId: string;
    gatewayOrderId?: string | null;
    transactionId?: string | null;
    method?: string | null;
    paidAt?: string | null;
  };
}

/* ---------------------------------------------------------------- blocks */

function contactOf(i: EventInput) {
  const ten = tenDigits(i.phone);
  const name = nz(i.name);
  return {
    name,
    firstName: name ? name.split(/\s+/)[0] : null,
    phone: ten || null,
    phoneE164: ten ? `+91${ten}` : null,
    whatsappUrl: ten ? `https://wa.me/91${ten}` : null,
    email: nz(i.email),
  };
}

function tripOf(i: EventInput) {
  return {
    packageSlug: nz(i.packageSlug),
    packageName: nz(i.packageName),
    packageCode: nz(i.packageCode),
    destination: nz(i.destination),
    nights: i.nights ?? null,
    departureDate: nz(i.date),
    departureDateLabel: dateLabel(i.date),
    fromCity: nz(i.citySlug),
    fromCityName: nz(i.cityName),
    occupancy: nz(i.occupancy),
    travellers: i.pax ?? null,
  };
}

/** the money block, identical in shape whether or not a payment happened */
function moneyOf(i: EventInput, q?: PaymentInput["quote"]) {
  const pax = i.pax ?? 1;
  const seat = i.seatPrice ?? null;
  const subtotal = seat == null ? null : seat * pax;
  const discount = i.coupon?.discount ?? (subtotal == null ? null : 0);
  const total =
    q ? rupees(q.totalPaise) : subtotal == null ? null : subtotal - (discount ?? 0);

  return {
    currency: "INR",

    seatPrice: seat,
    seatPricePaise: paiseOf(seat),
    subtotal,
    subtotalPaise: paiseOf(subtotal),
    discount,
    discountPaise: paiseOf(discount),
    tripTotal: total,
    tripTotalPaise: q ? q.totalPaise : paiseOf(total),

    couponCode: nz(i.coupon?.code),
    couponLabel: nz(i.coupon?.label),
    couponDiscount: i.coupon?.discount ?? null,
    couponDiscountPaise: paiseOf(i.coupon?.discount ?? null),

    // present as null on a lead, so the paths never disappear
    paidNow: q ? rupees(q.holdTotalPaise) : null,
    paidNowPaise: q ? q.holdTotalPaise : null,
    holdBase: q ? rupees(q.holdBasePaise) : null,
    holdBasePaise: q ? q.holdBasePaise : null,
    gst: q ? rupees(q.holdGstPaise) : null,
    gstPaise: q ? q.holdGstPaise : null,
    advanceStillDue: q ? rupees(q.advanceBalancePaise) : null,
    advanceStillDuePaise: q ? q.advanceBalancePaise : null,
    dueAtDeparture: q ? rupees(q.departureBalancePaise) : null,
    dueAtDeparturePaise: q ? q.departureBalancePaise : null,

    holdPercent: q ? q.holdPercent : null,
    gstPercent: q ? q.gstPercent : null,
    advancePercent: q ? q.advancePercent : null,
  };
}

const EMPTY_PAYMENT = {
  status: null as string | null,
  orderId: null as string | null,
  gateway: null as string | null,
  gatewayOrderId: null as string | null,
  transactionId: null as string | null,
  method: null as string | null,
  paidAt: null as string | null,
};

function crmOf(i: EventInput, src: Required<LeadSource>, stage: string, dealValue: number | null) {
  const who = nz(i.name) ?? "Traveller";
  const trip = nz(i.packageName) ?? "Trip";
  const when = dateLabel(i.date);
  const pax = i.pax ?? 1;
  const bits = [`${pax} pax`, when].filter(Boolean).join(", ");

  return {
    dealName: bits ? `${trip} — ${who} (${bits})` : `${trip} — ${who}`,
    dealValue,
    stage,
    // a creator booking belongs to the creator; everything else to its surface
    leadSource: src.creator ? `creator:${src.creator}` : src.surface,
    expectedCloseDate: expectedClose(i.date),
  };
}

const envelope = (event: string, eventId: string) => ({
  event,
  eventId,
  schemaVersion: SCHEMA_VERSION,
  occurredAt: new Date().toISOString(),
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
});

/* ---------------------------------------------------------------- events */

export function buildLeadEvent(i: EventInput) {
  const src = resolveSource(i.source, null);
  const money = moneyOf(i);
  return {
    ...envelope("lead.captured", `evt_lead_${i.id}`),
    contact: contactOf(i),
    trip: tripOf(i),
    money,
    source: src,
    payment: { ...EMPTY_PAYMENT },
    crm: crmOf(i, src, "lead", money.tripTotal),
    links: { tripUrl: i.packageSlug ? `${SITE}/trips/${i.packageSlug}` : null },
  };
}

export function buildPaymentEvent(i: PaymentInput) {
  const src = resolveSource(i.source, null);
  const money = moneyOf(i, i.quote);
  const paid = i.payment.status === "paid";
  return {
    ...envelope(paid ? "payment.completed" : "payment.failed", `evt_pay_${i.payment.orderId}`),
    contact: contactOf(i),
    trip: tripOf(i),
    money,
    source: src,
    payment: {
      status: nz(i.payment.status),
      orderId: nz(i.payment.orderId),
      gateway: "phonepe",
      gatewayOrderId: nz(i.payment.gatewayOrderId),
      transactionId: nz(i.payment.transactionId),
      method: nz(i.payment.method),
      paidAt: nz(i.payment.paidAt),
    },
    crm: crmOf(i, src, paid ? "seat_held" : "payment_failed", money.tripTotal),
    links: { tripUrl: i.packageSlug ? `${SITE}/trips/${i.packageSlug}` : null },
  };
}

/* ------------------------------------------------------- config resolution */

/**
 * Which URL a webhook goes to.
 *
 * Lives in this dependency-free module purely so it can be tested directly.
 * The impure wrapper that reads env and settings is `crmWebhookUrl()` in
 * lib/webhooks.ts.
 *
 * Order matters. Environment first, so Dokploy stays authoritative and a stale
 * value left in the admin panel can never quietly take over. The admin field is
 * a fallback, not an override — and it must be consulted at all, because the
 * field is labelled "n8n / CRM webhook url" and until now only the college form
 * read it, which is exactly why hold-my-seat leads never reached the CRM.
 */
export function pickWebhookUrl(
  envN8n: string | undefined,
  envBooking: string | undefined,
  settingsUrl: string | undefined
): string {
  for (const candidate of [envN8n, envBooking, settingsUrl]) {
    const url = (candidate ?? "").trim();
    if (/^https?:\/\//i.test(url)) return url;
  }
  return "";
}
