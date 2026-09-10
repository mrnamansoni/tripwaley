#!/usr/bin/env node
/**
 * "Invoice amount in words" — the line every Indian invoice carries.
 *
 * Run: node scripts/test-amount-in-words.mjs
 *
 * Tested before it is written because the Indian numbering system is not the
 * one most number-to-words code implements. After the first thousand it groups
 * in twos, not threes: 1,00,000 is a lakh and 1,00,00,000 is a crore. Code that
 * assumes million/billion produces a number that is not wrong so much as
 * unreadable to the person it is written for.
 *
 * Input is PAISE, matching every other money function in this codebase, so the
 * rupee/paise split happens in one place rather than at each call site.
 */

import assert from "node:assert/strict";
import { amountInWords } from "../src/lib/amountInWords.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };
const eq = (paise, expected) => {
  assert.equal(amountInWords(paise), expected, `${paise} paise`);
  ok(`${paise} → ${expected}`);
};

console.log("\namount in words — the basics");
eq(0, "Zero Rupees only");
eq(100, "One Rupee only");
eq(200, "Two Rupees only");
eq(1900, "Nineteen Rupees only");
eq(2000, "Twenty Rupees only");
eq(9900, "Ninety Nine Rupees only");

console.log("\nhundreds and the teens that trip up naive code");
eq(10000, "One Hundred Rupees only");
eq(11100, "One Hundred Eleven Rupees only");
eq(11500, "One Hundred Fifteen Rupees only");
eq(99900, "Nine Hundred Ninety Nine Rupees only");

console.log("\nthousands");
eq(100000, "One Thousand Rupees only");
eq(1000000, "Ten Thousand Rupees only");
eq(1100000, "Eleven Thousand Rupees only");
eq(2400000, "Twenty Four Thousand Rupees only", "the Vyapar template's own total");
eq(9999900, "Ninety Nine Thousand Nine Hundred Ninety Nine Rupees only");

console.log("\nlakh — where million-based code goes wrong");
eq(10000000, "One Lakh Rupees only");
eq(11000000, "One Lakh Ten Thousand Rupees only");
eq(999999900, "Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Rupees only");

console.log("\ncrore");
eq(1000000000, "One Crore Rupees only");
eq(1010000000, "One Crore One Lakh Rupees only");

console.log("\npaise — GST on a 5% hold is rarely a whole rupee");
eq(4761875, "Forty Seven Thousand Six Hundred Eighteen Rupees and Seventy Five Paise only");
eq(5, "Five Paise only");
eq(110, "One Rupee and Ten Paise only");
eq(101, "One Rupee and One Paisa only");

console.log("\na real invoice total");
eq(4761900, "Forty Seven Thousand Six Hundred Nineteen Rupees only");

console.log(`\n${n} assertions passed\n`);
