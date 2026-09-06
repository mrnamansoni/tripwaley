# CRM webhook reference

Every lead and every payment posts one JSON event to your n8n webhook.
Real captured samples live in [`docs/webhook-samples/`](./webhook-samples/) — import one into n8n
and build the mapping against it.

## Where the URL comes from

Resolved in this order, first valid `http(s)` URL wins:

1. `N8N_WEBHOOK_URL` (environment / Dokploy)
2. `TW_BOOKING_WEBHOOK` (environment / Dokploy)
3. **Admin → Settings → "n8n / CRM webhook url"**

Environment first, so Dokploy stays authoritative and a stale value left in the admin panel can
never quietly take over.

> **This ordering is the fix for a real bug.** Until 2026-09-06, `/api/lead` — every
> "Hold my seat" on the site — read `N8N_WEBHOOK_URL` alone, while the admin field was read only by
> the college quote form. A URL configured in the admin panel therefore made college quotes fire
> and seat holds silently not. Leads were still saved to `data/bookings.json`; they just never
> reached the CRM.

**Admin → Bookings** shows which source the URL came from, the last 40 delivery attempts with
status and latency, and a **Send test event** button that posts a real `test.ping` through the real
sender and reports what n8n replied.

## Events

| `event` | Fires when |
| --- | --- |
| `lead.captured` | Someone submits "Hold my seat", the timed popup, or any lead form |
| `payment.completed` | A seat-hold payment is confirmed by PhonePe (state **and** amount agree) |
| `payment.failed` | A payment failed, or the settled amount did not match what we priced |
| `test.ping` | The admin's test button |

## Two guarantees you can build a mapping on

**Every path exists on every event.** A mapping referencing `money.couponCode` will not break on a
booking without a coupon — the key is present and `null`. This holds across all event types.

**Every leaf is a scalar.** No nullable nested objects, because `money.coupon.code` would exist on
one event and vanish on the next. Coupon and UTM fields are flat for this reason, and `payment` is
always a full object with `null` members on a lead rather than being `null` itself.

## Structure

```
event               "lead.captured" | "payment.completed" | "payment.failed" | "test.ping"
eventId             stable per event — use it to deduplicate. n8n and PhonePe both retry.
schemaVersion       1
occurredAt          ISO 8601 UTC
environment         "production" | "development"

contact.name / firstName / phone / phoneE164 / whatsappUrl / email
trip.packageSlug / packageName / packageCode / destination / nights
    .departureDate / departureDateLabel / fromCity / fromCityName / occupancy / travellers
money.currency / seatPrice / subtotal / discount / tripTotal
    .couponCode / couponLabel / couponDiscount
    .paidNow / holdBase / gst / advanceStillDue / dueAtDeparture      (null on a lead)
    .holdPercent / gstPercent / advancePercent                        (null on a lead)
    — every figure above also present as <name>Paise (integer)
source.page / url-path the visitor was on / surface / creator / creatorName / referrer
    .utmSource / utmMedium / utmCampaign / utmContent / utmTerm
payment.status / orderId / gateway / gatewayOrderId / transactionId / method / paidAt
crm.dealName / dealValue / stage / leadSource / expectedCloseDate
links.tripUrl
```

### Money

Every figure appears twice: **rupees** (`paidNow: 1102.5`) for humans and CRM currency fields, and
**integer paise** (`paidNowPaise: 110250`) for anything that must reconcile exactly against
PhonePe's settlement report. Never do arithmetic on the rupee values.

The three booking stages always reconstruct the total:

```
holdBase + advanceStillDue + dueAtDeparture === tripTotal
```

### The `crm` block

Pre-computed so a mapping is a drag rather than an expression:

| Field | Example | Map to |
| --- | --- | --- |
| `dealName` | `Manali Exploration — Aisha Khan (2 pax, Sat, 14 Nov)` | Deal / Opportunity name |
| `dealValue` | `41300` | Deal amount — the **trip total**, not the hold |
| `stage` | `lead` · `seat_held` · `payment_failed` | Pipeline stage |
| `leadSource` | `creator:naman` · `booking-bar` · `timed-popup` | Lead source |
| `expectedCloseDate` | `2026-11-07` | Close date — one week before departure, when the team collects the rest of the advance |

### Attribution

`source.page` is the path the visitor was on. The browser reports it and the server cross-checks it
against the `Referer` header: they normally agree, the header wins when they disagree, and an
off-site referer is ignored rather than trusted.

`source.creator` is set whenever the booking came through `/travel-with/<creator>/…`, with
`creatorName` resolved from the catalog. That answers both attribution questions: which page
produced the lead, and which creator to credit.

UTM values are remembered for the browser session, so a visitor who arrives from
`?utm_source=instagram`, browses three trips and then books still credits the campaign.

## Deduplication

Use `eventId`. It is stable for a given event — `evt_lead_<leadId>`, `evt_pay_<orderId>` — so a
retry from PhonePe or a re-run in n8n carries the same id and must not create a second deal.
