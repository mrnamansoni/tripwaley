/**
 * Markdown representations of public pages, for agents.
 *
 * An AI agent asked to answer "what does a Spiti trip cost from Delhi" currently
 * has to parse ~230KB of scroll-driven HTML to find a number that lives in one
 * table cell. Cloudflare's Markdown-for-Agents convention says: when a client
 * sends `Accept: text/markdown`, hand it the content instead of the layout.
 *
 * This is written as a RENDERER PER ROUTE TYPE rather than an HTML-to-markdown
 * converter, for two reasons. A converter would faithfully reproduce every
 * navigation link and decorative heading, which is most of the noise we are
 * trying to remove. And it would drift: the markdown would silently change
 * shape whenever the page design did. Reading the catalog directly means the
 * facts an agent needs — prices, dates, what is included — are the same facts
 * the page renders, in the order an answer needs them.
 *
 * A path with no renderer here is simply not negotiated: the agent gets the
 * normal HTML, which is the correct outcome rather than a degraded one.
 */

import {
  getPackage,
  getCity,
  getPost,
  getLivePackages,
  getPricedCities,
  citiesPricedFor,
  upcomingDepartures,
  fromPrice,
  holdRates,
  getSettings,
  nightsLabel,
  inr,
} from "./catalog";
import { getDestination, destinationsFor } from "./destinations";

const SITE = "https://tripwaley.com";

/** ISO date → "Mon, 26 Oct 2026" */
function when(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const bookingTerms = () => {
  const r = holdRates();
  return [
    `- Hold a seat online by paying ${r.holdPercent}% of the trip price plus ${r.gstPercent}% GST on that amount. It counts toward the trip, not on top of it.`,
    `- Our team collects the rest of the ${r.advancePercent}% advance closer to the departure date.`,
    `- The balance is due at departure.`,
  ].join("\n");
};

/* ------------------------------------------------------------------ trip */

function tripMd(slug: string): string | null {
  const pkg = getPackage(slug);
  if (!pkg || pkg.status !== "live") return null;
  const priced = citiesPricedFor(slug);
  const deps = upcomingDepartures({ packageSlug: slug, limit: 12 });

  const out = [`# ${pkg.name}`, ""];
  if (pkg.destination) out.push(`**Route:** ${pkg.destination}`);
  if (pkg.nights) out.push(`**Length:** ${nightsLabel(pkg)}`);
  if (pkg.bestTime) out.push(`**Best time:** ${pkg.bestTime}`);
  if (pkg.transport) out.push(`**Transport:** ${pkg.transport}`);
  out.push("", `Fixed-date group departure. Book one seat, not a private tour.`, "");

  if (pkg.summaryFromDelhi?.trim()) out.push("## About this trip", "", pkg.summaryFromDelhi.trim(), "");

  if (priced.length) {
    out.push("## Price per seat, by boarding city", "", "| Boarding city | Triple sharing | Double sharing |", "| --- | --- | --- |");
    for (const { city, rule } of priced) {
      out.push(`| ${city.name} | ${rule.triple ? inr(rule.triple) : "—"} | ${rule.double ? inr(rule.double) : "—"} |`);
    }
    out.push("");
  }

  if (deps.length) {
    out.push("## Upcoming departures", "");
    for (const d of deps) out.push(`- ${when(d.date)}`);
    out.push("");
  }

  if (pkg.itinerary?.length) {
    out.push("## Itinerary", "");
    for (const day of pkg.itinerary) {
      out.push(`### Day ${day.day} — ${day.title}`);
      if (day.body?.trim()) out.push("", day.body.trim());
      const bits: string[] = [];
      if (day.stay) bits.push("overnight stay");
      if (day.meals?.length) bits.push(`meals: ${day.meals.join(", ")}`);
      if (bits.length) out.push("", `*Included: ${bits.join(" · ")}*`);
      out.push("");
    }
  }

  if (pkg.inclusions?.length) out.push("## What's included", "", ...pkg.inclusions.map((i) => `- ${i}`), "");
  if (pkg.exclusions?.length) out.push("## What's not included", "", ...pkg.exclusions.map((i) => `- ${i}`), "");

  out.push("## How booking works", "", bookingTerms(), "");
  out.push("---", "", `Source: ${SITE}/trips/${pkg.slug}`);
  return out.join("\n");
}

/* ----------------------------------------------------------- destination */

function destinationMd(slug: string): string | null {
  const dest = getDestination(slug);
  if (!dest) return null;
  const trips = getLivePackages().filter((p) => destinationsFor(p).some((d) => d.slug === slug));
  if (!trips.length) return null;
  const priced = getPricedCities();

  const out = [
    `# ${dest.name} group trips`,
    "",
    `**Where:** ${dest.state}, India`,
    `**Operator:** Tripwaley — fixed-date group departures`,
    "",
    dest.intro,
    "",
    "## Best time to visit",
    "",
    dest.bestTime,
    "",
    "## Getting there",
    "",
    dest.gettingThere,
    "",
    "## What people get wrong",
    "",
    dest.know,
    "",
    `## Trips to ${dest.name}`,
    "",
  ];

  for (const p of trips) {
    const rates = priced.map((c) => fromPrice(p.slug, c.slug)).filter((v): v is number => typeof v === "number");
    const low = rates.length ? Math.min(...rates) : null;
    out.push(`### ${p.name}`);
    out.push(`- Length: ${nightsLabel(p)}`);
    if (p.destination) out.push(`- Route: ${p.destination}`);
    out.push(`- From: ${low != null ? `${inr(low)} per seat` : "priced on request"}`);
    const deps = upcomingDepartures({ packageSlug: p.slug, limit: 5 });
    if (deps.length) out.push(`- Next departures: ${deps.map((d) => when(d.date)).join("; ")}`);
    out.push(`- Details: ${SITE}/trips/${p.slug}`, "");
  }

  out.push("## How booking works", "", bookingTerms(), "");
  out.push("---", "", `Source: ${SITE}/destinations/${dest.slug}`);
  return out.join("\n");
}

/* ------------------------------------------------------------------ city */

function cityMd(slug: string): string | null {
  const city = getCity(slug);
  if (!city?.priced) return null;
  const trips = getLivePackages().flatMap((p) => {
    const price = fromPrice(p.slug, slug);
    return typeof price === "number" ? [{ p, price }] : [];
  });

  const out = [
    `# Group trips departing from ${city.name}`,
    "",
    `**Boarding city:** ${city.name}, ${city.state ?? "India"}`,
    `**Operator:** Tripwaley`,
    "",
    `Every trip below boards in ${city.name} and returns to ${city.name}. The fare covers the road at both ends — there is no separate journey to Delhi to begin the holiday.`,
    "",
    `## Trips priced from ${city.name}`,
    "",
    "| Trip | Length | From (per seat) |",
    "| --- | --- | --- |",
  ];
  for (const { p, price } of trips) out.push(`| ${p.name} | ${nightsLabel(p)} | ${inr(price)} |`);
  out.push("");

  const deps = upcomingDepartures({ citySlug: slug, limit: 12 });
  if (deps.length) {
    out.push(`## Upcoming departures from ${city.name}`, "");
    for (const d of deps) out.push(`- ${when(d.date)} — ${d.package.name}`);
    out.push("");
  }

  out.push("## How booking works", "", bookingTerms(), "");
  out.push("---", "", `Source: ${SITE}/from/${city.slug}`);
  return out.join("\n");
}

/* ----------------------------------------------------------------- story */

function storyMd(slug: string): string | null {
  const post = getPost(slug);
  if (!post) return null;
  const out = [`# ${post.title}`, ""];
  if (post.author) out.push(`**By:** ${post.author}`);
  if (post.date) out.push(`**Published:** ${when(post.date)}`);
  out.push("", post.body.trim(), "", "---", "", `Source: ${SITE}/stories/${post.slug}`);
  return out.join("\n");
}

/* ------------------------------------------------------------------ site */

function siteMd(): string {
  const s = getSettings();
  const trips = getLivePackages();
  const cities = getPricedCities();
  return [
    "# Tripwaley",
    "",
    `India's premium group-departure travel company. Fixed-date group trips across India with a certified trip captain on every batch, stays and transport included, boarding in ${cities.length} cities.`,
    "",
    "## What we sell",
    "",
    "Seats on fixed-date group departures — not custom private tours. You book one seat (or several) on a batch that runs on a published date with a capped group size. Solo travellers are matched into twin-share rooms by age and gender at no single supplement.",
    "",
    "## How booking works",
    "",
    bookingTerms(),
    "",
    `## Trips currently on sale (${trips.length})`,
    "",
    ...trips.map((p) => `- [${p.name}](${SITE}/trips/${p.slug}) — ${p.destination || p.route || "group departure"}`),
    "",
    "## Boarding cities",
    "",
    ...cities.map((c) => `- [${c.name}](${SITE}/from/${c.slug})`),
    "",
    "## Contact",
    "",
    s.whatsapp ? `- WhatsApp: +${s.whatsapp.replace(/\D/g, "")}` : "",
    `- Web: ${SITE}/contact`,
    "",
    "---",
    "",
    `A fuller machine-readable brief lives at ${SITE}/llms.txt`,
  ].filter((l) => l !== "").join("\n");
}

/* --------------------------------------------------------------- routing */

/** Does this path have a markdown representation? */
export function markdownFor(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return siteMd();

  const seg = path.split("/").filter(Boolean);
  if (seg.length !== 2) return null;
  const [section, slug] = seg;

  switch (section) {
    case "trips": return tripMd(slug);
    case "destinations": return destinationMd(slug);
    case "from": return cityMd(slug);
    case "stories": return storyMd(slug);
    default: return null;
  }
}

export { MARKDOWN_SECTIONS, hasMarkdown, wantsMarkdown } from "./markdownRoutes";
