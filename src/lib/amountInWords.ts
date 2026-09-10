/**
 * An amount in paise, written out the way an Indian invoice writes it.
 *
 * The grouping is the whole point. Indian numbering breaks in twos above a
 * thousand — 1,00,000 is one lakh, 1,00,00,000 is one crore — so the usual
 * thousand/million/billion ladder gives a technically-correct string that reads
 * as foreign on an invoice issued from Rajouri Garden.
 *
 * Takes paise, like every other money function here, so no call site has to
 * remember which unit it is holding.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** 0–999 in words. Empty string for 0, so callers can drop absent groups. */
function underThousand(n: number): string {
  const out: string[] = [];
  if (n >= 100) {
    out.push(ONES[Math.floor(n / 100)], "Hundred");
    n %= 100;
  }
  // the teens are irregular and have to be looked up whole, not built from
  // "Ten" + a digit
  if (n >= 20) {
    out.push(TENS[Math.floor(n / 10)]);
    n %= 10;
  }
  if (n > 0) out.push(ONES[n]);
  return out.join(" ");
}

/** A whole number in words, grouped crore / lakh / thousand / rest. */
function indianWords(n: number): string {
  if (n === 0) return "";
  const groups: [number, string][] = [
    [10_000_000, "Crore"],
    [100_000, "Lakh"],
    [1_000, "Thousand"],
  ];
  const out: string[] = [];
  for (const [size, name] of groups) {
    const count = Math.floor(n / size);
    if (count > 0) {
      // a crore count can itself run past 999, so recurse rather than assume
      out.push(indianWords(count) || underThousand(count), name);
      n %= size;
    }
  }
  if (n > 0) out.push(underThousand(n));
  return out.join(" ");
}

export function amountInWords(paise: number): string {
  const total = Math.max(0, Math.round(paise));
  const rupees = Math.floor(total / 100);
  const pais = total % 100;

  if (rupees === 0 && pais === 0) return "Zero Rupees only";

  const parts: string[] = [];
  if (rupees > 0) parts.push(`${indianWords(rupees)} ${rupees === 1 ? "Rupee" : "Rupees"}`);
  if (pais > 0) {
    // "and" only when there is a rupee figure for it to join
    if (parts.length) parts.push("and");
    parts.push(`${indianWords(pais)} ${pais === 1 ? "Paisa" : "Paise"}`);
  }
  return `${parts.join(" ")} only`;
}
