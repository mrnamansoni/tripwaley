#!/usr/bin/env node
/**
 * CRM webhook payloads.
 *
 * Run: node scripts/test-webhooks.mjs
 *
 * Two properties matter more than anything else here, and both are the kind
 * that silently rot:
 *
 *   • EVERY KEY IS ALWAYS PRESENT. An n8n mapping references a path; when the
 *     path vanishes on some events (a lead with no coupon, a lead with no
 *     creator) the mapping errors and the record never reaches the CRM. So the
 *     shape is identical on every event, with null standing in for "no value".
 *
 *   • MONEY IS EXACT. Rupees for humans and CRM currency fields, integer paise
 *     alongside for anything that has to reconcile against PhonePe's
 *     settlement report.
 */

import assert from "node:assert/strict";
import {
  buildLeadEvent,
  buildPaymentEvent,
  EVENT_KEYS,
  flattenKeys,
  resolveSource,
  pickWebhookUrl,
} from "../src/lib/webhookPayload.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const LEAD = {
  id: "ab12cd34",
  name: "Naman Soni",
  phone: "9625330270",
  packageSlug: "spiti-solo-circuit",
  packageName: "Spiti, the long way round",
  packageCode: "TRWLY-N12",
  destination: "Spiti",
  nights: 6,
  date: "2026-10-26",
  citySlug: "delhi",
  cityName: "Delhi",
  occupancy: "triple",
  pax: 2,
  seatPrice: 24500,
  source: { page: "/travel-with/rashi/spiti-solo-circuit", surface: "creator-date-card", creator: "rashi" },
};

console.log("\nwebhook — the envelope is stable");
{
  const e = buildLeadEvent(LEAD);
  assert.equal(e.event, "lead.captured");
  assert.equal(e.schemaVersion, 1);
  assert.ok(e.eventId?.startsWith("evt_"), "an idempotency key is required — n8n and PhonePe both retry");
  assert.ok(!Number.isNaN(Date.parse(e.occurredAt)), "occurredAt must be a real ISO instant");
  ok("event, schemaVersion, eventId and occurredAt are always set");
}

console.log("\nwebhook — EVERY key is present on EVERY event");
{
  const rich = buildPaymentEvent({
    ...LEAD,
    coupon: { code: "FIRSTTRIP", label: "5% off", discount: 2450 },
    quote: { totalPaise: 4655000, holdBasePaise: 232750, holdGstPaise: 11638,
             holdTotalPaise: 244388, advanceBalancePaise: 698250,
             departureBalancePaise: 3724000, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-X", gatewayOrderId: "OMO1", transactionId: "T1",
               method: "UPI_INTENT", paidAt: "2026-09-05T10:00:00.000Z" },
  });

  // the sparsest possible lead: no name, no coupon, no creator, no date, no price
  const sparse = buildLeadEvent({
    id: "z", phone: "9625330270", packageSlug: "", packageName: "", packageCode: "",
    destination: "", nights: null, date: "", citySlug: "", cityName: "",
    occupancy: "", pax: 1, seatPrice: null, name: "",
    source: { page: "/", surface: "timed-popup" },
  });

  // no exclusions: `payment` is a full object with null members on a lead too,
  // so even payment.* paths must match between a lead and a completed payment
  const richKeys = flattenKeys(rich);
  const sparseKeys = flattenKeys(sparse);
  const missing = richKeys.filter((k) => !sparseKeys.includes(k));

  assert.deepEqual(missing, [], `these paths vanish on a sparse lead and would break n8n: ${missing.join(", ")}`);
  ok("a lead with no name, coupon, creator, date, price OR payment carries every path a paid order does");

  // and the documented key list is actually what ships
  for (const k of EVENT_KEYS) {
    assert.ok(sparseKeys.some((p) => p === k || p.startsWith(k + ".")), `documented key "${k}" is missing`);
  }
  ok("every key named in the published schema is really emitted");
}

console.log("\nwebhook — nulls, never undefined");
{
  const sparse = buildLeadEvent({
    id: "z", phone: "9625330270", packageSlug: "x", packageName: "X", packageCode: "",
    destination: "", nights: null, date: "", citySlug: "", cityName: "",
    occupancy: "", pax: 1, seatPrice: null, name: "",
    source: { page: "/", surface: "timed-popup" },
  });
  const json = JSON.stringify(sparse);
  // JSON.stringify DROPS undefined — anything undefined would silently vanish
  const round = JSON.parse(json);
  assert.deepEqual(flattenKeys(sparse).sort(), flattenKeys(round).sort(),
    "a key set to undefined would disappear through JSON.stringify");
  assert.equal(round.money.couponCode, null, "coupon fields are FLAT scalars, so the path never disappears");
  assert.equal(round.source.creator, null);
  ok("absent values are null, so nothing is lost in serialisation");
}

console.log("\nwebhook — money is exact and doubled");
{
  const e = buildPaymentEvent({
    ...LEAD, coupon: null,
    quote: { totalPaise: 4900000, holdBasePaise: 245000, holdGstPaise: 12250,
             holdTotalPaise: 257250, advanceBalancePaise: 735000,
             departureBalancePaise: 3920000, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-Y", gatewayOrderId: null, transactionId: null,
               method: null, paidAt: null },
  });
  assert.equal(e.money.currency, "INR");
  assert.equal(e.money.tripTotal, 49000);
  assert.equal(e.money.tripTotalPaise, 4900000);
  assert.equal(e.money.paidNow, 2572.5, "₹2,572.50 must survive as a decimal");
  assert.equal(e.money.paidNowPaise, 257250, "and exactly as paise");
  assert.equal(e.money.advanceStillDue, 7350);
  assert.equal(e.money.dueAtDeparture, 39200);
  ok("every figure appears in rupees and as integer paise, and they agree");

  // the three stages must still reconstruct the trip total
  assert.equal(e.money.holdBasePaise + e.money.advanceStillDuePaise + e.money.dueAtDeparturePaise,
    e.money.tripTotalPaise);
  ok("hold + advance balance + departure balance === trip total, in the payload too");
}

console.log("\nwebhook — the crm block is ready to map");
{
  const e = buildPaymentEvent({
    ...LEAD, coupon: null,
    quote: { totalPaise: 4900000, holdBasePaise: 245000, holdGstPaise: 12250,
             holdTotalPaise: 257250, advanceBalancePaise: 735000,
             departureBalancePaise: 3920000, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-Y", gatewayOrderId: null, transactionId: null,
               method: null, paidAt: null },
  });
  assert.match(e.crm.dealName, /Spiti/, "deal name names the trip");
  assert.match(e.crm.dealName, /Naman/, "and the traveller");
  assert.match(e.crm.dealName, /2 pax/, "and the party size");
  assert.equal(e.crm.dealValue, 49000, "deal value is the TRIP total, not the hold");
  assert.equal(e.crm.stage, "seat_held");
  assert.equal(e.crm.leadSource, "creator:rashi", "a creator booking is attributed to the creator");
  assert.equal(e.crm.expectedCloseDate, "2026-10-19", "one week before departure — when the advance is collected");
  ok("dealName, dealValue, stage, leadSource and expectedCloseDate are pre-computed");

  const direct = buildLeadEvent({ ...LEAD, source: { page: "/trips/x", surface: "booking-bar" } });
  assert.equal(direct.crm.leadSource, "booking-bar", "a direct booking is attributed to the surface");
  assert.equal(direct.crm.stage, "lead");
  ok("a non-creator lead is attributed to its surface instead");
}

console.log("\nwebhook — contact is CRM-shaped");
{
  const e = buildLeadEvent(LEAD);
  assert.equal(e.contact.phone, "9625330270");
  assert.equal(e.contact.phoneE164, "+919625330270", "CRMs want E.164");
  assert.equal(e.contact.whatsappUrl, "https://wa.me/919625330270");
  assert.equal(e.contact.firstName, "Naman", "first name split out for a Contact record");
  assert.equal(e.contact.email, null);
  ok("phone in both forms, first name split, email null rather than absent");
}

console.log("\nwebhook — eventId is stable per event, not per call");
{
  const a = buildPaymentEvent({ ...LEAD, coupon: null,
    quote: { totalPaise: 1, holdBasePaise: 0, holdGstPaise: 0, holdTotalPaise: 0,
             advanceBalancePaise: 0, departureBalancePaise: 0, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-SAME", gatewayOrderId: null, transactionId: null, method: null, paidAt: null } });
  const b = buildPaymentEvent({ ...LEAD, coupon: null,
    quote: { totalPaise: 1, holdBasePaise: 0, holdGstPaise: 0, holdTotalPaise: 0,
             advanceBalancePaise: 0, departureBalancePaise: 0, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-SAME", gatewayOrderId: null, transactionId: null, method: null, paidAt: null } });
  assert.equal(a.eventId, b.eventId, "a retried delivery of the same event must carry the same id");

  const other = buildPaymentEvent({ ...LEAD, coupon: null,
    quote: { totalPaise: 1, holdBasePaise: 0, holdGstPaise: 0, holdTotalPaise: 0,
             advanceBalancePaise: 0, departureBalancePaise: 0, holdPercent: 5, gstPercent: 5, advancePercent: 20 },
    payment: { status: "paid", orderId: "TW-OTHER", gatewayOrderId: null, transactionId: null, method: null, paidAt: null } });
  assert.notEqual(a.eventId, other.eventId, "different orders must not collide");
  ok("same order → same eventId (no duplicate deals); different order → different id");
}

console.log("\nwebhook — source is reconciled against the referer");
{
  const client = { page: "/travel-with/rashi/spiti-solo-circuit", surface: "creator-date-card", creator: "rashi" };

  let r = resolveSource(client, "https://tripwaley.com/travel-with/rashi/spiti-solo-circuit");
  assert.equal(r.page, "/travel-with/rashi/spiti-solo-circuit");
  assert.equal(r.creator, "rashi");
  ok("client and referer agree → the client value stands");

  r = resolveSource(client, "https://tripwaley.com/trips/manali");
  assert.equal(r.page, "/trips/manali", "the header wins when they disagree");
  ok("a mismatched referer overrides a browser-supplied page");

  r = resolveSource(client, null);
  assert.equal(r.page, "/travel-with/rashi/spiti-solo-circuit", "no header → trust the client");
  ok("a missing referer falls back to the client value");

  r = resolveSource(undefined, "https://tripwaley.com/college-trips");
  assert.equal(r.page, "/college-trips");
  assert.equal(r.surface, "unknown");
  ok("no client source at all still yields a usable page from the header");

  r = resolveSource(client, "https://evil.example.com/whatever");
  assert.equal(r.page, "/travel-with/rashi/spiti-solo-circuit", "an off-site referer is ignored, not trusted");
  ok("an external referer can't rewrite attribution");
}

console.log("\nwebhook — where the URL comes from (this WAS the bug)");
{
  const HOOK = "https://n8n.example.com/webhook/abc";
  // the reported failure: the URL was only in the admin panel, and /api/lead
  // read the environment alone — so hold-my-seat leads silently never fired
  assert.equal(pickWebhookUrl(undefined, undefined, HOOK), HOOK,
    "a URL set ONLY in Admin -> Settings must now be used");
  ok("a URL configured only in the admin panel is honoured");

  assert.equal(pickWebhookUrl("https://env.example/a", undefined, HOOK), "https://env.example/a",
    "the environment must beat the admin panel");
  assert.equal(pickWebhookUrl(undefined, "https://env.example/b", HOOK), "https://env.example/b");
  ok("either environment variable overrides the admin panel");

  assert.equal(pickWebhookUrl("", "   ", ""), "", "nothing configured anywhere -> no delivery");
  assert.equal(pickWebhookUrl("not-a-url", undefined, HOOK), HOOK,
    "a malformed value is skipped rather than used");
  ok("blank and malformed values fall through instead of breaking delivery");
}

console.log(`\n${n} assertions passed.\n`);
