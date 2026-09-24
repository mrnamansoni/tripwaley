/* LIVE VALUES IN STORY TEXT.
 *
 * {{price <trip-slug> [city-slug]}} and {{next-departure <trip-slug>}} are
 * filled in when the page renders, so a story can never quote a price the
 * admin has since changed. A token whose trip is gone renders a link, because
 * a wrong number costs more than a missing one. */

export type TokenNode = string | { text: string; href: string };

export interface TokenLookup {
  price(tripSlug: string, citySlug?: string): number | undefined;
  nextDeparture(tripSlug: string): string | undefined;
}

const TOKEN = /\{\{(price|next-departure)\s+([a-z0-9-]+)(?:\s+([a-z0-9-]+))?\}\}/g;

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function expandTokens(text: string, lookup: TokenLookup): TokenNode[] {
  const out: TokenNode[] = [];
  let at = 0;
  let buffer = "";
  const push = (s: string) => { buffer += s; };
  const flush = () => { if (buffer) { out.push(buffer); buffer = ""; } };

  for (const m of (text ?? "").matchAll(TOKEN)) {
    const [raw, kind, trip, city] = m;
    push(text.slice(at, m.index));
    at = m.index! + raw.length;

    if (kind === "price") {
      const value = lookup.price(trip, city);
      if (value == null) { flush(); out.push({ text: "see current trips", href: "/trips" }); }
      else push(rupees(value));
    } else {
      const date = lookup.nextDeparture(trip);
      if (!date) { flush(); out.push({ text: "see current dates", href: "/trips" }); }
      else push(date);
    }
  }
  push(text.slice(at));
  flush();
  return out;
}
