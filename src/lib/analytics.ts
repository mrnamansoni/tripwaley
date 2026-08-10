/**
 * Ad-platform + analytics events — CLIENT SAFE.
 *
 * Every helper is a no-op when the pixel isn't loaded (IDs unset, script
 * blocked, ad blocker, local dev), so call sites never have to guard. That
 * matters: an analytics failure must never break a booking flow.
 *
 * Meta events follow the names Meta's own install doc specifies; the GA4
 * equivalents (view_item / begin_checkout) are fired alongside so both
 * platforms see the same funnel without duplicating call sites.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface TripEvent {
  slug: string;
  name: string;
  /** INR, per seat. Omit/0 when the trip is "on request". */
  price?: number;
}

const fbq = (...args: unknown[]) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq(...args);
};
const gtag = (...args: unknown[]) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args);
};

/** SPA route change. Meta has no history-based auto-tracking, so it needs
 *  this; GA4's Enhanced Measurement handles history events itself, which is
 *  why we deliberately do NOT fire a GA4 page_view here (that would
 *  double-count every client-side navigation). */
export function trackPageView() {
  fbq("track", "PageView");
}

/** A trip detail page was opened. */
export function trackViewContent({ slug, name, price }: TripEvent) {
  const value = price && price > 0 ? price : undefined;
  fbq("track", "ViewContent", {
    content_name: name,
    content_ids: [slug],
    content_type: "product",
    ...(value ? { value, currency: "INR" } : {}),
  });
  gtag("event", "view_item", {
    currency: "INR",
    ...(value ? { value } : {}),
    items: [{ item_id: slug, item_name: name, ...(value ? { price: value } : {}) }],
  });
}

/** Someone started the hold/booking flow (Hold a seat, Hold my seat, Claim). */
export function trackInitiateCheckout({ slug, name, price }: TripEvent) {
  const value = price && price > 0 ? price : undefined;
  fbq("track", "InitiateCheckout", {
    content_name: name,
    content_ids: [slug],
    ...(value ? { value, currency: "INR" } : {}),
  });
  gtag("event", "begin_checkout", {
    currency: "INR",
    ...(value ? { value } : {}),
    items: [{ item_id: slug, item_name: name, ...(value ? { price: value } : {}) }],
  });
}

/** A lead was actually captured (phone submitted, /api/lead accepted it).
 *  Not in Meta's install doc, but this is the real conversion the ads are
 *  optimising toward until payments exist — Purchase stays unused until then. */
export function trackLead({ slug, name, price }: TripEvent) {
  const value = price && price > 0 ? price : undefined;
  fbq("track", "Lead", {
    content_name: name,
    content_ids: [slug],
    ...(value ? { value, currency: "INR" } : {}),
  });
  gtag("event", "generate_lead", {
    currency: "INR",
    ...(value ? { value } : {}),
    items: [{ item_id: slug, item_name: name }],
  });
}
