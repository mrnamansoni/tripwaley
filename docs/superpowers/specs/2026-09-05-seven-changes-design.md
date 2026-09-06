# Seven changes — design

**Date:** 2026-09-05
**Status:** approved, in build

Shipped as four batches, each verified before the next.

| Batch | Items |
| --- | --- |
| A | #7 webhook not firing, #4 lead/booking source capture |
| B | #2 per-package booking toggle, #5 travellers + departure city |
| C | #3 weather missing on 9 of 22 trips |
| D | #1 creator "Ask <creator>" section, #6 read-more |

---

## Batch A — webhooks and attribution

### The bug (#7)

Three call sites, three different configurations, and they disagree:

| Fires on | Reads |
| --- | --- |
| `/api/lead` — every "Hold my seat" | `N8N_WEBHOOK_URL` env **only** |
| `/api/college-quote` | `N8N_WEBHOOK_URL` env **or** `settings.n8nWebhook` |
| `/api/book`, and `settle.ts` on a paid order | `TW_BOOKING_WEBHOOK` env **only** |

Admin → Settings shows a field labelled "n8n / CRM webhook url" (`settings.n8nWebhook`) that
**only the college form reads**. A URL pasted there — the obvious place — makes college quotes
fire while hold-my-seat leads silently do not. Leads are still written to `data/bookings.json`,
so nothing is lost; they just never reach the CRM.

### Fix

`src/lib/webhooks.ts` owns resolution and delivery for every sender:

```
crmWebhookUrl() = process.env.N8N_WEBHOOK_URL
               || process.env.TW_BOOKING_WEBHOOK
               || getSettings().n8nWebhook
               || ""
```

Env first so Dokploy stays authoritative; the admin field works as a fallback. All four senders
call `postToCrm(event, payload)`. Delivery is fire-and-forget with a timeout — a hung n8n must
never block a traveller — but each attempt records outcome (status, ms, error) to a small
in-memory ring buffer surfaced in the admin, plus a **Test webhook** button that POSTs a synthetic
event and reports the real response. "Is it firing?" becomes a fact rather than a guess.

### Payload (#4)

One envelope for every event. **Every key is always present, `null` when it has no value** — an
n8n mapping breaks when a path disappears. This forces a design rule: **every leaf is a scalar.**
A nullable nested object is the same trap in disguise — `money.coupon.code` would exist on a
booking with a coupon and vanish on one without. So coupon and UTM fields are flat
(`couponCode`, `utmSource`, …), null when absent, and the path is identical on every event.

Events: `lead.captured`, `payment.completed`, `payment.failed`, `college.quote_requested`.

```jsonc
{
  "event": "payment.completed",
  "eventId": "evt_<stable per event>",   // idempotency: PhonePe and n8n both retry
  "schemaVersion": 1,
  "occurredAt": "<ISO 8601 UTC>",
  "environment": "production" | "development",

  "contact": { "name", "firstName", "phone", "phoneE164", "whatsappUrl", "email" },

  "trip": { "packageSlug", "packageName", "packageCode", "destination", "nights",
            "departureDate", "departureDateLabel",
            "fromCity", "fromCityName", "occupancy", "travellers" },

  "money": { "currency": "INR",
             "seatPrice", "subtotal", "discount", "tripTotal",
             "couponCode", "couponLabel", "couponDiscount",
             "paidNow", "holdBase", "gst", "advanceStillDue", "dueAtDeparture",
             // every figure above also present as <name>Paise, integer, exact
           },

  "source": { "page", "url", "surface", "creator", "creatorName", "referrer",
              "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm" },

  "payment": { "status", "orderId", "gateway", "gatewayOrderId",
               "transactionId", "method", "paidAt" } | null,

  "crm": { "dealName", "dealValue", "stage", "leadSource", "expectedCloseDate" },

  "links": { "tripUrl" }
}
```

Money appears twice on purpose: rupees for humans and CRM currency fields, integer paise for
anything that must reconcile exactly against PhonePe's settlement report.

`crm` is pre-computed so a mapping is a drag, not an expression:
`dealName: "Spiti, the long way round — Naman (2 pax, 26 Oct)"`, `leadSource: "creator:rashi"`,
`stage: "seat_held" | "lead" | "payment_failed"`, `expectedCloseDate` = one week before departure,
which is when the team collects the rest of the advance.

**Breaking change:** this replaces the current flat payload
(`{event, id, name, phone, package, city, date, occupancy, price, source, ts}`). The existing n8n
mapping must be updated once. Sample payloads for every event ship in `docs/webhook-samples/` so
the mapping can be built before the change goes live.

### Source attribution

```ts
interface LeadSource {
  page: string;          // "/travel-with/rashi/spiti-solo-circuit"
  surface: string;       // booking-bar | hold-modal | creator-date-card | timed-popup | college-form
  creator?: string;      // creator slug when the booking came through a creator page
  packageSlug?: string;
  utm?: Record<string, string>;
}
```

Sent by the client and **cross-checked server-side against the `Referer` header**: the client value
is used when the two agree or the header is absent, and the server-derived path wins otherwise.
This is attribution, not security, but a browser-supplied field should not be the only witness.

Stored on the `Booking` row and on the payment `Order`, shown as a column in Admin → Bookings and
Admin → Payments. `/api/lead` currently truncates `source` to 30 characters; that cap is replaced
by the structured object.

---

## Batch B — booking toggle and travellers

`Package.bookingEnabled?: boolean`, **defaulting to true** so every existing package keeps working
untouched. Checkbox in Admin → Packages.

Enforced in two places, because a client-only toggle is decorative:
- the UI renders no Pay button when it is false
- `/api/pay/create` refuses the order outright

Effective payability = `phonepeConfigured() && bookingEnabled !== false && quote.chargeable`.

The booking modal gains:

- **Travellers**, 1–20. Total becomes `seat × pax`; the 5% hold scales with it. `quoteTrip()`
  already computes `seat * pax`, so the server re-derives this and never trusts the browser's
  number — a 20× larger booking is exactly where a client-supplied figure would matter.
- **Departure city**, listing *only cities with a price rule for that package*. This structurally
  removes the class of bug fixed in 307e6e9: an unpriced city can no longer be selected, so the
  bar can never quote one city's price under another city's name. The bar's own `bookCity` state
  drives both the displayed quote and the modal, initialised from the global city when that city
  is priced and otherwise from the first priced city.

---

## Batch C — weather

`DEST_GEO` is a hardcoded `[RegExp, {lat, lng, place}][]` living inside
`src/app/trips/[slug]/page.tsx`. Any package whose name/destination/route it fails to match
renders no weather — **9 of 22 live trips**: Kashmir, Lansdowne, Andaman, Meghalaya, Kerala,
Rishikesh, Udaipur, Manali Exploration, Kasol.

- Move the table to `src/lib/geo.ts` and extend it to cover those nine (all unambiguous places).
- Add `lat` / `lng` / `weatherPlace` to `Package`, editable in Admin → Packages, taking precedence
  over the table.

Today's nine are fixed without data entry; every future package is self-service, so the table
never needs editing again.

---

## Batch D — creator section and read-more

### #1 — "Ask <creator>"

There is one creator template, so this is built once and appears for every creator with their own
name, portrait, handle and voice. Nothing is Rashi-specific.

Removed from the hero CTA row; becomes a dedicated section low on the page, before the closing CTA
band: portrait, a line in the creator's voice, WhatsApp CTA, GSAP scroll reveal matching the
site's existing idiom. Reduced-motion is respected.

### #6 — read-more

Measured on production, longest paragraph per page:

| Page | Longest paragraph |
| --- | --- |
| `/college-trips` | **1,278 chars** (4 long paragraphs) |
| `trips/udaipur-short-trip-from-delhi` | 372 |
| `trips/lansdowne-weekend-escape` | 366 |
| `trips/kashmir-honeymoon-shikara-days` | 320 |
| `trips/meghalaya-solo-explorer` | 268 |

One `<ReadMore>` client component: CSS `line-clamp` so the **full text stays in the DOM for SEO**,
a real `<button>` with `aria-expanded`, and no layout jump on toggle. Applied to `/college-trips`,
the long trip-page fields (summary, travel tips, things to carry), itinerary day bodies, and
creator bios. The applied list is reported after the change rather than promised in advance.

---

## Testing

No test runner; `node:assert` scripts under `scripts/`, per existing convention.

- `test-webhooks.mjs` — resolution order (env beats admin), stable payload shape (no key ever
  missing), `eventId` stability, money present in both rupees and paise.
- `test-source.mjs` — client/referer reconciliation, creator attribution.
- Existing 35 assertions (`money`, `seed-guard`, `gateway-config`) stay green throughout.
