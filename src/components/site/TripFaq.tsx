import Link from "next/link";
import type { ReactNode } from "react";
import type { City, PriceRule } from "@/lib/types";
import { inr, minRate, shortDate, weekday } from "@/lib/types";
import { text } from "@/lib/catalog";
import { REFUND_SLAB } from "@/lib/refunds";
import { faqJsonLd, jsonLdScript } from "@/lib/schema";

/* QUESTIONS BEFORE YOU PAY — the money page answers its own worries.
 *
 * Every answer is built from data the site already publishes: the hold % from
 * Settings, the boarding cities and fares from this trip's price rules, its
 * real departure dates, the refund slab /refund-policy shows, and the owner's
 * own solo-page promises. Nothing here is typed in by hand, so nothing here
 * can drift from what checkout charges. Native <details>: no JavaScript, and
 * every answer is in the server HTML whether it is open or shut. */

interface Qa { q: string; a: string; body: ReactNode }

export default function TripFaq({
  tripName,
  rates,
  priced,
  deps,
  forSolo = true,
}: {
  tripName: string;
  /** false on couples' trips, where "I'm travelling alone" is the wrong question */
  forSolo?: boolean;
  rates: { holdPercent: number; gstPercent: number; advancePercent: number };
  priced: { city: City; rule: PriceRule }[];
  deps: { date: string; cities: City[] }[];
}) {
  const gst = rates.gstPercent > 0 ? ` + ${rates.gstPercent}% GST` : "";
  const fares = priced
    .map(({ city, rule }) => ({ city, from: minRate(rule.triple, rule.double, rule.quad) }))
    .filter((f): f is { city: City; from: number } => typeof f.from === "number");
  const next = deps.slice(0, 4);
  const solo = text("solo.promises")
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((parts) => parts.length === 2 && parts[1])
    .slice(0, 2)
    .map(([, detail]) => detail);

  const qas: Qa[] = [
    {
      q: "How does booking work?",
      a: `Reserve a seat free for 24 hours, then hold it by paying ${rates.holdPercent}% of the trip price${gst} on this site. That amount counts toward your trip, not on top of it. The rest of your ${rates.advancePercent}% advance is collected closer to the date, and the balance at departure.`,
      body: (
        <p>
          Reserve a seat free for 24 hours, then hold it by paying <strong>{rates.holdPercent}% of the trip price{gst}</strong> on
          this site. That amount counts toward your trip, not on top of it. The rest of your {rates.advancePercent}% advance is
          collected closer to the date, and the balance at departure.
        </p>
      ),
    },
    fares.length > 0
      ? {
          q: "Which cities can I board from?",
          a: `${tripName} boards from ${fares.map((f) => `${f.city.name} (from ${inr(f.from)})`).join(", ")}. Your city not listed? WhatsApp us and we'll tell you the nearest boarding point.`,
          body: (
            <>
              <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {fares.map((f) => (
                  <li key={f.city.slug} className="flex justify-between gap-3 border-b border-dashed border-line py-1.5">
                    <Link href={`/from/${f.city.slug}`} className="font-semibold text-ink underline-offset-4 hover:text-brand hover:underline">
                      {f.city.name}
                    </Link>
                    <span className="font-bold text-ink">from {inr(f.from)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">Your city not listed? WhatsApp us and we&apos;ll tell you the nearest boarding point.</p>
            </>
          ),
        }
      : {
          q: "Which cities can I board from?",
          a: "This trip is priced on request. WhatsApp us with your city and we'll send the fare and the nearest boarding point.",
          body: <p>This trip is priced on request. WhatsApp us with your city and we&apos;ll send the fare and the nearest boarding point.</p>,
        },
    next.length > 0
      ? {
          q: "When are the next batches?",
          a: next.map((d) => `${weekday(d.date)} ${shortDate(d.date)}`).join(", ") + ".",
          body: (
            <ul className="space-y-1.5">
              {next.map((d) => (
                <li key={d.date}>
                  <strong>{weekday(d.date)}, {shortDate(d.date)}</strong>
                  {d.cities.length > 0 && <span> · boards in {d.cities.map((c) => c.name).join(", ")}</span>}
                </li>
              ))}
            </ul>
          ),
        }
      : {
          q: "When are the next batches?",
          a: "No dates are published yet. Reserve a seat and we'll tell you as soon as the next batch opens.",
          body: <p>No dates are published yet. Reserve a seat and we&apos;ll tell you as soon as the next batch opens.</p>,
        },
    {
      q: "What if I have to cancel?",
      a: REFUND_SLAB.map((r) => `${r.window}: ${r.refund}.`).join(" ") + " The full policy explains how refunds are paid.",
      body: (
        <>
          <ul className="space-y-1.5">
            {REFUND_SLAB.map((r) => (
              <li key={r.window} className="flex justify-between gap-3 border-b border-dashed border-line py-1.5">
                <span>{r.window}</span>
                <strong className="shrink-0 text-ink">{r.refund}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            <Link href="/refund-policy" className="font-bold text-brand underline-offset-4 hover:underline">Read the full refund policy</Link>{" "}
            for how refunds are paid and how long they take.
          </p>
        </>
      ),
    },
    ...(forSolo && solo.length > 0
      ? [{
          q: "I'm travelling alone. Is that okay?",
          a: solo.join(" "),
          body: (
            <>
              {solo.map((line) => <p key={line} className="mt-1.5 first:mt-0">{line}</p>)}
              <p className="mt-3">
                <Link href="/solo" className="font-bold text-brand underline-offset-4 hover:underline">How solo trips work</Link>
              </p>
            </>
          ),
        }]
      : []),
  ];

  const schema = faqJsonLd(qas.map(({ q, a }) => ({ q, a })));

  return (
    <section id="faq" aria-labelledby="trip-faq-title" className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript([schema]) }} />}
      <h2 id="trip-faq-title" className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        Questions <span className="text-brand">before you pay.</span>
      </h2>
      <div className="mt-7 divide-y divide-line rounded-3xl border border-line bg-card shadow-sm">
        {qas.map((x, i) => (
          <details key={x.q} className="group px-6 py-5 sm:px-8" open={i === 0}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 font-display text-lg font-extrabold text-ink">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/30 text-lg text-ink/65 transition-transform duration-300 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-white"
              >
                +
              </span>
              {x.q}
            </summary>
            <div className="mt-3 pl-12 text-[0.95rem] leading-relaxed text-ink/75">{x.body}</div>
          </details>
        ))}
      </div>
      <p className="mt-5 text-sm text-ink/70">
        The fine print:{" "}
        <Link href="/refund-policy" className="font-semibold underline underline-offset-4 hover:text-brand">Refund policy</Link>
        {" · "}
        <Link href="/terms" className="font-semibold underline underline-offset-4 hover:text-brand">Terms</Link>
        {" · "}
        <Link href="/privacy" className="font-semibold underline underline-offset-4 hover:text-brand">Privacy</Link>
      </p>
    </section>
  );
}
