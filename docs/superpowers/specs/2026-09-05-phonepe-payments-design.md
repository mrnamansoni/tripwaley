# PhonePe payments — design

**Date:** 2026-09-05
**Status:** approved, in build

## The problem

The site takes no money. `/api/book-token` is a stub that sleeps 800ms and returns
`paymentUrl: "#placeholder-checkout"`; the seat-hold modal offers a hardcoded
"Pay ₹2,000 token & book" button that does nothing. Meanwhile the trip pages and the
Terms page describe a 20% advance. None of that matches how Tripwaley actually sells.

PhonePe has issued sandbox credentials (client_id / client_secret / client_version),
which identifies the API as **Standard Checkout V2 (OAuth)** — not the older
merchantId + saltKey / X-VERIFY flow that most tutorials still show.

## The money model

Three stages. Only the first one happens on the website.

| Stage | Amount | Where | Meaning |
| --- | --- | --- | --- |
| 1 | 5% of trip total, **plus 5% GST on that 5%** | Website, via PhonePe | Holds the seat |
| 2 | Balance up to 20% of trip total | Team, offline, ~1 week before departure | Confirms the booking |
| 3 | Remaining 80% | At departure | — |

Worked example, ₹18,000 booking:

| | |
| --- | --- |
| Hold base (5%) | ₹900 |
| GST on hold (5%) | ₹45 |
| **Charged online** | **₹945** |
| Advance balance collected offline (20% − 5%) | ₹2,700 |
| Balance at departure (80%) | ₹14,400 |

Driven by three admin settings: `holdPercent` (5), `gstPercent` (5),
`advancePercent` (20, already exists).

### Arithmetic rules

All money is computed in **integer paise** and rounded once per step. Floats are never
carried between steps. A 5%-of-5% calculation on an odd price (₹8,499 → hold ₹424.95 →
GST ₹21.2475) drifts if done in rupees as floats, and PhonePe takes an integer paise
amount — a drifted amount fails reconciliation.

```
totalPaise            = total * 100
holdBasePaise         = round(totalPaise * holdPercent / 100)
holdGstPaise          = round(holdBasePaise * gstPercent / 100)
holdTotalPaise        = holdBasePaise + holdGstPaise      // sent to PhonePe
advanceTotalPaise     = round(totalPaise * advancePercent / 100)
advanceBalancePaise   = advanceTotalPaise - holdBasePaise // GST is tax, not advance
departureBalancePaise = totalPaise - advanceTotalPaise
```

PhonePe's minimum order is **100 paise (₹1)**. A quote below that cannot be charged and
must fail with a clear message rather than being silently rounded up.

### Assumptions recorded (owner to confirm before go-live)

1. **The hold is adjusted against the 20% advance and is refundable under the existing
   cancellation slab.** This is what the Terms and Refund Policy will say. The alternative
   (non-refundable) is legal but requires explicit pre-payment disclosure and a tick-box
   under the Consumer Protection (E-Commerce) Rules 2020, which is a different build.
2. **Displayed trip prices are GST-exclusive**, since GST is charged on top of the hold.
   If prices are meant to be GST-inclusive, this line double-charges and `gstPercent`
   should be set to 0.

## Architecture

### Trust boundary

The browser never sends an amount. `/api/pay/create` receives only
`{packageSlug, citySlug, date, occupancy, pax, couponCode, name, phone}`, looks the rate up
in the catalog, re-runs `applyCoupon()` server-side, computes the quote, and stores it on
the order. That stored figure is the only amount that matters.

**PhonePe's redirect is not proof of payment.** Anyone can navigate to a return URL. The
only authority is the Order Status API, and an order is marked paid only when the status
response says `COMPLETED` *and* its `amount` equals the paise figure stored at creation.

### Order storage

`data/orders.json`, via `src/lib/orders.ts` — deliberately **not** `catalog.json`.
The admin PUT rewrites catalog.json wholesale; an admin pressing Save while a payment
callback landed would silently destroy the order. Separate file, separate write path.

```ts
interface Order {
  id: string;               // merchantOrderId: "TW-<base36>-<rand>", ≤63 chars, [A-Za-z0-9_-] only
  createdAt: string; updatedAt: string;
  status: "created" | "paid" | "failed" | "expired";
  packageSlug: string; packageName: string;
  citySlug: string; cityName: string;
  date: string; occupancy: "double" | "triple"; pax: number;
  coupon?: { code: string; label: string; discount: number };
  quote: HoldQuote;         // frozen at creation — the authority
  contact: { name: string; phone: string };
  phonepe?: { orderId?: string; state?: string; transactionId?: string;
              paymentMode?: string; errorCode?: string };
  paidAt?: string;
}
```

### PhonePe client — `src/lib/phonepe.ts`

Endpoints confirmed from PhonePe's own documentation:

| | Sandbox | Production |
| --- | --- | --- |
| OAuth | `https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token` | `https://api.phonepe.com/apis/identity-manager/v1/oauth/token` |
| Create payment | `…/pg-sandbox/checkout/v2/pay` | `https://api.phonepe.com/apis/pg/checkout/v2/pay` |
| Order status | `…/pg-sandbox/checkout/v2/order/{merchantOrderId}/status` | `https://api.phonepe.com/apis/pg/checkout/v2/order/{merchantOrderId}/status` |

- OAuth is `application/x-www-form-urlencoded` with `client_id`, `client_version`,
  `client_secret`, `grant_type=client_credentials`. Response carries `access_token` and
  `expires_at` (epoch seconds). The token is cached in module memory until 60s before
  expiry rather than re-fetched per payment.
- All other calls send `Authorization: O-Bearer <access_token>`.
- Create payment body: `{merchantOrderId, amount (paise, min 100), expireAfter (300–3600s),
  paymentFlow: {type: "PG_CHECKOUT", message, merchantUrls: {redirectUrl}}, metaInfo{udf1…}}`.
  Response: `{orderId, state: "PENDING", expireAt, redirectUrl}`.
- `merchantOrderId` max length 63, no special characters except `_` and `-`.
- `metaInfo` udf1–udf10 ≤256 chars; udf11–udf15 alphanumeric plus `_-+@.` ≤50 chars.

Configured entirely by environment, entered by the owner in Dokploy:
`PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`,
`PHONEPE_ENV` (`sandbox` | `production`), `PHONEPE_WEBHOOK_USER`, `PHONEPE_WEBHOOK_PASS`.

**Fail closed:** if the credentials are absent the Pay button does not render at all,
rather than rendering a button that 500s.

### Routes

| Route | Job |
| --- | --- |
| `POST /api/pay/create` | Price server-side, write the order, call `checkout/v2/pay`, return `redirectUrl` |
| `GET /pay/return?order=…` | PhonePe's redirect target. Calls Order Status, verifies state **and** amount, updates the order, renders the outcome |
| `POST /api/pay/webhook` | PhonePe server-to-server callback. Verifies the credential header, updates the order — catches the customer who paid and closed the tab |
| `GET /api/pay/status?order=…` | Small poller for the PENDING case (UPI collect can take ~2 minutes) |

`/api/book-token` is deleted.

## Copy sweep

Every place the site currently states a number that contradicts the model above:

| File | Now | Becomes |
| --- | --- | --- |
| `src/app/trips/[slug]/page.tsx:200` | `{advancePercent}% · rest later` | `{holdPercent}% · to hold your seat` |
| `src/app/trips/[slug]/page.tsx:332` | `Hold any seat with a {advancePercent}% advance.` | the three-stage sentence |
| `src/app/honeymoon/page.tsx:51` | `{advancePercent}%` / "to reserve" | `{holdPercent}%` / "to hold" |
| `src/components/booking/HoldSeatModal.tsx:106` | `amount: 2000` | removed — server prices it |
| `src/components/booking/HoldSeatModal.tsx:241` | "Lock it in with a token" | real hold wording |
| `src/components/booking/HoldSeatModal.tsx:254` | `Pay ₹2,000 token & book` | `Pay ₹945 to hold your seat` (computed) |
| `src/app/api/book-token/route.ts:31` | `amount: body.amount ?? 2000` | file deleted |
| `src/app/terms/page.tsx:76–81` | "advance of 20% … confirms" | full three-stage ladder |
| `src/app/refund-policy/page.tsx` | silent on the online hold | new clause covering it |

## Admin

A read-only **Payments** tab: orders newest-first, status pills, amount, contact, trip,
PhonePe order id, and a per-row "refresh status" for anything stuck on PENDING.
`holdPercent` and `gstPercent` join `advancePercent` in Settings.

## Testing

No test runner is configured in this repo; the established convention is `node:assert`
scripts under `scripts/`. Money arithmetic is written test-first that way
(`scripts/test-money.mjs`), covering: the worked example, odd-price rounding, the
₹1 PhonePe floor, `gstPercent: 0`, and that hold + advance-balance + departure-balance
reconstruct the total exactly.
