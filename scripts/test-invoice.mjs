#!/usr/bin/env node
/**
 * The invoice's payment summary.
 *
 * Run: node scripts/test-invoice.mjs
 *
 * THE RULE UNDER TEST, in every case: the printed column adds up.
 *
 *     Amount payable − Paid now = Balance due
 *
 * That is not automatic here. The trip total EXCLUDES the GST charged on the
 * hold, while the amount actually paid INCLUDES it. Subtract one from the other
 * and you get a balance that is short by the GST — which is exactly the figure
 * the customer would compute themselves, on a document they are checking
 * because they are about to pay it. Hence the "Amount payable" subtotal, which
 * exists solely so the arithmetic closes on the page.
 *
 * Written before the module, because a receipt that does not reconcile is worse
 * than no receipt: it reads as an attempt to overcharge.
 */

import assert from "node:assert/strict";
import { holdQuote } from "../src/lib/money.ts";
import { invoiceLines } from "../src/lib/invoiceLines.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const RATES = { holdPercent: 5, gstPercent: 5, advancePercent: 20 };

/** a minimal Order — invoiceLines only ever reads the quote and the coupon */
const order = (total, opts = {}) => ({
  id: "TW-TEST-0001",
  packageName: "Lansdowne",
  pax: opts.pax ?? 1,
  occupancy: opts.occupancy ?? "double",
  coupon: opts.coupon,
  quote: holdQuote({ total, ...RATES, ...(opts.rates ?? {}) }),
});

const find = (lines, label) => lines.find((l) => l.label === label);
const value = (lines, label) => find(lines, label)?.paise;

/** the invariant, asserted the same way for every shape of order */
function reconciles(o, why) {
  const lines = invoiceLines(o);
  const payable = value(lines, "Amount payable");
  const paidRow = lines.find((l) => l.label.startsWith("Paid now"));
  const balance = value(lines, "Balance due");
  assert.ok(payable != null, "an Amount payable row must exist");
  assert.ok(paidRow, "a Paid now row must exist");
  assert.ok(balance != null, "a Balance due row must exist");
  assert.equal(payable - paidRow.paise, balance, `${why}: payable − paid must equal balance`);
  ok(`${why} — ₹${(payable / 100).toLocaleString("en-IN")} − ₹${(paidRow.paise / 100).toLocaleString("en-IN")} = ₹${(balance / 100).toLocaleString("en-IN")}`);
  return lines;
}

console.log("\nthe column adds up");
reconciles(order(47500), "plain booking");
reconciles(order(47500, { coupon: { code: "TW500", label: "₹2,500 off", discount: 2500 } }), "with a coupon");
reconciles(order(89000, { pax: 3, occupancy: "triple" }), "three travellers, triple sharing");
reconciles(order(18000, { rates: { gstPercent: 0 } }), "GST switched off");
reconciles(order(47500, { rates: { holdPercent: 10 } }), "a 10% hold");
reconciles(order(1), "a one-rupee trip");

console.log("\nthe worked example from the design");
{
  // holdQuote takes the total AFTER the coupon, so ₹47,500 here is a ₹50,000
  // trip with ₹2,500 taken off — the same booking as the design's example
  const lines = invoiceLines(order(47500, { coupon: { code: "TW500", label: "₹2,500 off", discount: 2500 } }));
  assert.equal(value(lines, "Trip price"), 5_000_000, "pre-coupon trip price");
  assert.equal(value(lines, "Coupon TW500"), -250_000, "the coupon row is negative");
  assert.equal(value(lines, "Total"), 4_750_000, "total after coupon");
  assert.equal(value(lines, "GST 5% (on hold amount)"), 11_875, "5% GST on a ₹2,375 hold");
  assert.equal(value(lines, "Amount payable"), 4_761_875);
  assert.equal(lines.find((l) => l.label.startsWith("Paid now")).paise, 249_375);
  assert.equal(value(lines, "Balance due"), 4_512_500);
  ok("every figure matches the approved design");
}

console.log("\nrows that must not appear when they do not apply");
{
  const lines = invoiceLines(order(47500));
  assert.equal(find(lines, "Trip price"), undefined, "no Trip price row without a coupon");
  assert.ok(!lines.some((l) => l.label.startsWith("Coupon")), "no Coupon row without a coupon");
  assert.ok(find(lines, "Total"), "the single Total row survives");
  ok("no coupon — Trip price and Coupon collapse into Total");
}
{
  const lines = invoiceLines(order(18000, { rates: { gstPercent: 0 } }));
  assert.ok(!lines.some((l) => l.label.startsWith("GST")), "no GST row at 0%");
  assert.equal(lines.find((l) => l.label.startsWith("Paid now")).label, "Paid now — (5% hold)");
  ok("GST at 0% — the row goes, and the paid label drops “+ GST”");
}

console.log("\nthe hold percentage is read, never assumed");
{
  const lines = invoiceLines(order(47500, { rates: { holdPercent: 12 } }));
  assert.equal(lines.find((l) => l.label.startsWith("Paid now")).label, "Paid now — (12% hold + GST)");
  ok("a 12% hold says 12%, not 5%");
}

console.log("\nthe coupon deduction is signed, so a renderer cannot double-subtract");
{
  const lines = invoiceLines(order(50000, { coupon: { code: "SAVE", label: "x", discount: 4000 } }));
  const sum = (ls) => ls.filter((l) => l.kind === "row").reduce((a, l) => a + l.paise, 0);
  assert.equal(sum(lines), value(lines, "Amount payable"), "rows sum to the payable subtotal");
  ok("with a coupon, summing the rows reproduces Amount payable");

  // and the same invariant must hold when there is no coupon, where "Total" is
  // itself an addend rather than something derived from the rows above it
  const plain = invoiceLines(order(47500));
  assert.equal(sum(plain), value(plain, "Amount payable"), "rows sum to the payable subtotal");
  ok("without a coupon, summing the rows reproduces Amount payable");
}

console.log(`\n${n} assertions passed\n`);
