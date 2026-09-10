# Downloadable booking invoice (PDF)

**Date:** 2026-09-11
**Status:** approved, not yet implemented

## Problem

A customer pays a 5% hold through PhonePe and lands on `/pay/return`. They see a
confirmed seat, a decorative receipt and a breakdown — and nothing they can keep.
There is no document to forward to whoever is paying, no file to open three weeks
later when they have forgotten what they owe, and nothing to attach to a WhatsApp
message when they ask "what did I actually pay?".

The owner supplied a Vyapar-generated template (`Sale_144_02-09-2026.pdf`, four
pages) as the reference for what that document should contain.

## What this is, and what it is not

It is an **Invoice**. It is deliberately **not a GST tax invoice**: Tripwaley is a
sole proprietorship registered as an MSME, there is no GSTIN anywhere in settings,
and Vyapar already issues the real tax invoices under its own number sequence
(the sample is #144). A second system minting invoice numbers is how two documents
end up sharing a number at audit.

So: no GSTIN, no HSN/SAC column, no CGST/SGST/IGST split, no place of supply, and
no integer invoice sequence.

## Where the numbers come from

Every figure is read from the stored `Order`. Nothing is recomputed at render time
and nothing is accepted from the browser — the order is the only authority on the
amount, exactly as it is for the payment itself.

The advance/departure split shown on the return page is dropped. The invoice
states one balance.

```
Trip price                          ₹50,000     quote.totalPaise + coupon.discount
Coupon TW500                      −  ₹2,500     coupon.discount
Total                               ₹47,500     quote.totalPaise
GST 5% (on hold amount)               ₹ 119     quote.holdGstPaise
────────────────────────────────────────────
Amount payable                      ₹47,619     totalPaise + holdGstPaise
Paid now — (5% hold + GST)        −  ₹2,494     quote.holdTotalPaise
────────────────────────────────────────────
Balance due                         ₹45,125     advanceBalancePaise + departureBalancePaise
```

**Why `Amount payable` exists.** The trip total excludes GST; the paid amount
includes it. Without that subtotal the column does not visibly reconcile, and a
reader checking `47,500 − 2,494` gets a different balance than the one printed —
which reads as an error even though it is not. With it, the arithmetic closes.

This is a real defect in the current on-screen receipt, where GST sits between
"Trip total" and "Balance to pay" with no subtotal to bind them.

**Label rules.**
- The paid line reads `Paid now — (N% hold + GST)`, with `N` from
  `quote.holdPercent`, not hardcoded.
- When `quote.holdGstPaise === 0`, the GST row is omitted and the paid line
  reads `Paid now — (N% hold)`.
- When there is no coupon, the `Trip price` and `Coupon` rows collapse into a
  single `Total` row.

**Invoice number:** the order id (e.g. `TW-MJ8K2L-a1b2c3d4`). Already unique,
already the customer's reference, cannot collide with Vyapar.

**Invoice date:** `order.paidAt`.

## Document structure — three pages

Vyapar split the line-item table and the payment summary across its pages 1 and 2
because its generator paginates blindly. They belong together. Every section the
owner named is retained.

**Page 1 — the invoice**
- Letterhead: brand, `settings.address`, `settings.whatsapp`, sales email
- Bill To: `contact.name`, `contact.phone`, `contact.email`
- Invoice No. (order id) and date
- Line-item table: `#`, Item Name, Quantity, Unit, Price/Unit, Amount
  - one row: package name, `pax` × `Pax`, per-seat rate, line total
  - per-seat rate is `order.seatPrice` (pre-coupon) when stored. Orders written
    before that field existed fall back to
    `(totalPaise + coupon.discount) / pax`, which is also pre-coupon — using the
    discounted total would make the table's own Total disagree with the
    `Trip price` row directly beneath it
  - the table's Total row is the pre-coupon trip value, so it equals the
    `Trip price` row of the payment summary
- The payment summary above

**Page 2 — the booking**
- Booking Confirmation: package + `nightsLabel()`, traveller name, travel date,
  pax, destination, room sharing (`occupancy`), contact number, and a compact
  payment recap (paid / balance / total)
- Important Information
- Travel Disclaimer
- Why Choose Tripwaley

**Page 3 — the formalities**
- Invoice amount in words (Indian numbering)
- Terms & Conditions
- Pay To: bank account no., IFSC, account holder
- For: Tripwaley — Authorised Signatory

Package lookup for `nightsLabel()` and destination is by `order.packageSlug`. A
package that has since been renamed or deleted falls back to the stored
`order.packageName`, and the nights label is omitted rather than guessed.

## Admin-editable content

All invoice prose becomes `CONTENT_DEFS` keys, group **"Invoice (PDF)"**. New keys
resolve to their code default on production with no catalog migration
(`resolveContent`, `src/lib/types.ts:830`), and appear in the admin immediately.

| key | kind | content |
|---|---|---|
| `invoice.cancellation` | multiline | one bullet per line |
| `invoice.important` | multiline | Important Information bullets |
| `invoice.disclaimer` | multiline | Travel Disclaimer bullets |
| `invoice.whyUs` | multiline | Why Choose Tripwaley bullets |
| `invoice.terms` | multiline | Terms & Conditions |
| `invoice.footerNote` | line | closing line above the signatory |

Default for `invoice.cancellation`, per the owner's stated policy:

```
The hold amount paid to reserve your seat is non-refundable.
Cancel before your advance is cleared and nothing further is charged.
Once the advance is cleared, ₹4,000 per person is charged as a cancellation fee.
```

Bank details move into `settings` as new keys (`bankAccount`, `bankIfsc`,
`bankHolder`), defaulting to the template's HDFC account, rather than being
hardcoded. Any one of them left blank hides the whole Pay To block.

## Route and access

`GET /api/invoice?order=<id>` — Node runtime.

- 404 unless the order exists **and** `status === "paid"`. An unpaid order has no
  invoice.
- Rate-limited with `publicRateLimit`, as `/api/pay/status` is.
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Tripwaley-Invoice-<id>.pdf"`
- Sits outside `/api/admin`, so `guarded()` in `src/proxy.ts` does not apply.

**Access model:** possession of the order id, and nothing more. This is the same
level of protection the return page already has — that page renders the
customer's phone number and email at a guessable URL today. The PDF adds no new
class of exposure. Stated here so the choice is on the record rather than
implied.

Entry points:
1. A prominent download button on `/pay/return`, below the receipt printer.
2. A per-row link in `src/components/admin/PaymentsView.tsx`.

## Rendering

`@react-pdf/renderer` 4.9.0 — pure JS, declares React 19 support, does flexbox
layout, page breaks, wrapped text and embedded fonts. No browser engine.

Headless Chromium was rejected: ~300MB in a `output: "standalone"` Docker image
and hundreds of MB of RAM per render on a modest VPS. An n8n webhook round-trip
was rejected for the customer-facing path: it puts an external service between a
customer and their receipt seconds after they have paid, and either duplicates
the pricing logic outside the app or trusts figures from the browser.

**Fonts.** `@react-pdf/renderer` cannot read Tailwind or `next/font`. Bricolage
Grotesque (display) and Instrument Sans (body) are vendored as `.ttf` into
`public/fonts/` and registered by absolute path at render time — the same
precedent as pulling the Drive images local. Caveat is not vendored; a
handwriting face has no business on an invoice.

## Modules and boundaries

Two pure modules, no I/O, so both are testable on their own:

- **`src/lib/invoiceLines.ts`** — `invoiceLines(order): InvoiceLine[]`. Takes an
  `Order`, returns the payment-summary rows with labels and paise values. Owns
  the reconciliation and every label rule above. Knows nothing about PDFs.
- **`src/lib/amountInWords.ts`** — `amountInWords(paise): string`. Indian
  numbering.

Then:

- **`src/lib/invoiceDoc.tsx`** — the `@react-pdf/renderer` document. Takes an
  order, the resolved settings and the resolved copy strings as props. Does no
  reading of its own, so it can be rendered from a script for eyeballing.
- **`src/app/api/invoice/route.ts`** — reads, authorises, renders, streams.

## Tests

Following the repo's `scripts/test-*.mjs` convention, written before the modules
are wired in.

**`scripts/test-invoice.mjs`**
- reconciliation holds — `payable − paid === balance` — for: no coupon; with
  coupon; triple occupancy; `gstPercent: 0`; `pax: 1`; a coupon that zeroes the
  trip
- GST row omitted and the paid label drops "+ GST" when `holdGstPaise === 0`
- Trip price / Coupon rows collapse to a single Total when there is no coupon
- the paid label carries `quote.holdPercent`, not a hardcoded 5

**`scripts/test-amount-in-words.mjs`**
- 0, 1, 19, 47619, 100000, 10000000, and the carry cases around lakh and crore

## Deferred — recorded, not built

1. **Site refund copy still contradicts the invoice.** `settings.refundPolicy`
   and the FAQ (`src/lib/types.ts:163`) say "Free cancellation until 7 days
   before departure"; the invoice will state the hold is non-refundable and a
   ₹4,000 fee applies once the advance is cleared. The owner has chosen to leave
   the site copy as-is for now.
2. **Invoice delivery over WhatsApp and email.** The booking webhook will carry
   the invoice link; n8n will deliver it. Not built here.
3. **Post-advance invoice.** A second, updated invoice once the advance is
   cleared. Separate work.
4. **Bank account holder name.** The template's holder reads "Akshay Kumar";
   the registered grievance officer is "Akshay Verma". Worth confirming which is
   correct before it prints on every invoice.

## Out of scope

Emailing the invoice from the app — no mail sending exists in this codebase.
