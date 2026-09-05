#!/usr/bin/env node
/**
 * Money arithmetic for the PhonePe hold payment.
 *
 * Run: node scripts/test-money.mjs
 *
 * This is the one piece of the payment path where a rounding slip costs real
 * money, so it is tested before it is written. The rule under test throughout:
 * every figure is an INTEGER number of paise, rounded once per step, never
 * carried between steps as a float.
 */

import assert from "node:assert/strict";
import { holdQuote, formatPaise, PHONEPE_MIN_PAISE } from "../src/lib/money.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const RATES = { holdPercent: 5, gstPercent: 5, advancePercent: 20 };

console.log("\nmoney — the worked example (₹18,000)");
{
  const q = holdQuote({ total: 18000, ...RATES });
  assert.equal(q.totalPaise, 1_800_000);
  assert.equal(q.holdBasePaise, 90_000, "5% of ₹18,000 = ₹900");
  assert.equal(q.holdGstPaise, 4_500, "5% GST on ₹900 = ₹45");
  assert.equal(q.holdTotalPaise, 94_500, "charged online = ₹945");
  ok("hold = ₹900 + ₹45 GST = ₹945");

  assert.equal(q.advanceTotalPaise, 360_000, "20% of ₹18,000 = ₹3,600");
  assert.equal(q.advanceBalancePaise, 270_000, "₹3,600 − ₹900 already held = ₹2,700");
  ok("team collects ₹2,700 to reach the 20% advance");

  assert.equal(q.departureBalancePaise, 1_440_000, "80% of ₹18,000 = ₹14,400");
  ok("₹14,400 due at departure");

  assert.equal(q.chargeable, true);
  ok("quote is chargeable");
}

console.log("\nmoney — GST is tax, not part of the advance");
{
  const q = holdQuote({ total: 18000, ...RATES });
  // The ₹45 GST must NOT reduce what the team still has to collect.
  assert.equal(q.advanceBalancePaise, q.advanceTotalPaise - q.holdBasePaise);
  assert.notEqual(q.advanceBalancePaise, q.advanceTotalPaise - q.holdTotalPaise);
  ok("advance balance subtracts the hold base, not the GST-inclusive charge");
}

console.log("\nmoney — the three stages reconstruct the total exactly");
{
  for (const total of [18000, 8499, 15999, 23750, 1, 999999]) {
    const q = holdQuote({ total, ...RATES });
    const sum = q.holdBasePaise + q.advanceBalancePaise + q.departureBalancePaise;
    assert.equal(sum, q.totalPaise, `stages must sum to the total for ₹${total}`);
  }
  ok("hold base + advance balance + departure balance === total, for 6 prices");
}

console.log("\nmoney — odd prices round without float drift");
{
  const q = holdQuote({ total: 8499, ...RATES });
  assert.equal(q.totalPaise, 849_900);
  assert.equal(q.holdBasePaise, 42_495, "5% of ₹8,499 = ₹424.95 exactly");
  // 5% of 42,495p = 2,124.75p → rounds to 2,125p (₹21.25)
  assert.equal(q.holdGstPaise, 2_125, "GST rounds half-up to ₹21.25");
  assert.equal(q.holdTotalPaise, 44_620, "charged online = ₹446.20");
  ok("₹8,499 → ₹424.95 + ₹21.25 = ₹446.20");
}

console.log("\nmoney — every figure is an integer number of paise");
{
  for (const total of [8499, 15999, 23750, 7333, 12345]) {
    const q = holdQuote({ total, ...RATES });
    for (const [k, v] of Object.entries(q)) {
      if (!k.endsWith("Paise")) continue;
      assert.ok(Number.isInteger(v), `${k} must be an integer for ₹${total}, got ${v}`);
    }
  }
  ok("no fractional paise anywhere, across 5 prices");
}

console.log("\nmoney — PhonePe's ₹1 floor");
{
  assert.equal(PHONEPE_MIN_PAISE, 100, "PhonePe rejects orders under 100 paise");

  // ₹10 trip → 5% = 50p, GST = 3p, total 53p — below the floor.
  const tiny = holdQuote({ total: 10, ...RATES });
  assert.ok(tiny.holdTotalPaise < PHONEPE_MIN_PAISE);
  assert.equal(tiny.chargeable, false, "must refuse rather than silently round up");
  ok("a hold under ₹1 is refused, not rounded up");

  // ₹500 trip → 5% = ₹25 + ₹1.25 GST = ₹26.25 — comfortably chargeable.
  const fine = holdQuote({ total: 500, ...RATES });
  assert.equal(fine.holdTotalPaise, 2_625);
  assert.equal(fine.chargeable, true);
  ok("₹500 trip → ₹26.25 hold, chargeable");
}

console.log("\nmoney — GST can be switched off");
{
  const q = holdQuote({ total: 18000, holdPercent: 5, gstPercent: 0, advancePercent: 20 });
  assert.equal(q.holdGstPaise, 0);
  assert.equal(q.holdTotalPaise, q.holdBasePaise, "no GST → charge is the bare 5%");
  assert.equal(q.holdTotalPaise, 90_000);
  ok("gstPercent 0 charges ₹900 flat");
}

console.log("\nmoney — refuses nonsense instead of inventing a charge");
{
  for (const total of [0, -5000, NaN, Infinity]) {
    const q = holdQuote({ total, ...RATES });
    assert.equal(q.chargeable, false, `total ${total} must not be chargeable`);
    assert.equal(q.holdTotalPaise, 0);
  }
  ok("zero, negative, NaN and Infinity totals yield no charge");

  const clamped = holdQuote({ total: 18000, holdPercent: 500, gstPercent: -20, advancePercent: 20 });
  assert.equal(clamped.holdPercent, 100, "hold % clamps to 100");
  assert.equal(clamped.gstPercent, 0, "negative GST clamps to 0");
  ok("out-of-range percentages are clamped, not trusted");
}

console.log("\nmoney — display formatting");
{
  assert.equal(formatPaise(94_500), "₹945");
  assert.equal(formatPaise(44_620), "₹446.20");
  assert.equal(formatPaise(2_625), "₹26.25");
  assert.equal(formatPaise(1_440_000), "₹14,400");
  assert.equal(formatPaise(0), "₹0");
  ok("whole rupees drop the decimals; paise are shown to 2dp; thousands grouped");
}

console.log(`\n${n} assertions passed.\n`);
