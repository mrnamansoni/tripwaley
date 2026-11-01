import type { Metadata } from "next";
import Link from "next/link";
import SiteMedia from "@/components/site/SiteMedia";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import SiteFooter from "@/components/site/SiteFooter";
import { CtaBand } from "@/components/site/PageExtras";
import { parseLines } from "@/components/site/TripTypeSections";
import CorporateQuoteForm from "@/components/site/CorporateQuoteForm";
import { getCities, getSettings, getLivePackages, getPricedCities, slot, slotOne, text } from "@/lib/catalog";
import { DESTINATIONS, destinationsFor } from "@/lib/destinations";
import { canonical } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/schema";

export const metadata: Metadata = {
  ...canonical("/corporate-trips"),
  title: "Corporate trips & team offsites across India | Tripwaley",
  description:
    "Team offsites, incentive trips, weekend outings and partner trips across India — planned around your headcount and budget, with a Tripwaley captain on the ground the whole way.",
};

/* CORPORATE TRIPS — "out of office", taken literally.
   The people reading this live in an inbox and a calendar, so the page speaks
   that language: the hero is the auto-reply your team gets to send, the trip
   formats are calendar blocks, a sample day is a meeting agenda with the
   meetings struck out, and the form drafts the invite as you fill it.
   Truth over hype: no client logos, ratings or "teams hosted" counts — the
   only numbers are counted from the catalog (destinations, boarding cities). */

/* a sample day, illustrative — the struck-out line is what it replaces */
const AGENDA: { at: string; was: string; now: string }[] = [
  { at: "07:00", was: "Commute", now: "Chai on the balcony, mountains optional" },
  { at: "09:30", was: "Daily stand-up", now: "Stand-up at the top of a short trek" },
  { at: "11:00", was: "Quarterly review", now: "The one session you came to have — in a room with a view" },
  { at: "13:30", was: "Lunch at the desk", now: "One long table, everybody at it" },
  { at: "15:00", was: "Back-to-back calls", now: "Rafting, a cycle trail, or a nap. Team's call." },
  { at: "20:00", was: "Logging off late", now: "Bonfire. Nobody checks Slack." },
];

/* corporate questions only — the general ones live on /team#faqs */
const FAQS = [
  {
    q: "Do we have to pick one of your listed trips?",
    a: "No. The trips on the site are a starting point. A corporate trip is planned for your group — your dates, your headcount, your budget per head.",
  },
  {
    q: "Our team is spread across cities. Can everyone still travel together?",
    a: "Yes. Tell us which offices people are travelling from and we'll plan the pick-ups so the group meets on one itinerary.",
  },
  {
    q: "Can we fit work into the trip?",
    a: "Yes — mention it in the brief. We'll pick a stay with a room or a quiet space that works for a session, and plan the rest of the day around it.",
  },
  {
    q: "How is it priced?",
    a: "Per head, for your actual headcount, in one quote for the company. Send us a budget per head and we'll tell you honestly what it buys.",
  },
  {
    q: "Who is with us on the trip?",
    a: "A Tripwaley captain travels with the group the whole way — the same people who run our group departures — so there is one number to call for anything.",
  },
];

export default function CorporateTripsPage() {
  const settings = getSettings();
  const live = getLivePackages();
  const boarding = getPricedCities();
  const hero = slotOne("corporate.hero");
  const gallery = slot("corporate.gallery").slice(0, 4);

  const formats = parseLines(text("corporate.formats")).map((l) => {
    const [title = "", span = "", detail = ""] = l.split("|").map((x) => x.trim());
    return { title, span, detail };
  }).filter((f) => f.title);
  const handled = parseLines(text("corporate.handled"));

  // only destinations we actually run trips to right now
  const places = DESTINATIONS.map((d) => ({
    ...d,
    trips: live.filter((p) => destinationsFor(p).some((x) => x.slug === d.slug)).length,
  }))
    .filter((d) => d.trips > 0)
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 8);

  const faqLd = faqJsonLd(FAQS);

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar />
      <main id="main" className="bg-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Corporate trips", path: "/corporate-trips" }]),
              ...(faqLd ? [faqLd] : []),
            ]),
          }}
        />

        {/* ---------- the auto-reply ---------- */}
        <section className="px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">corporate trips &amp; offsites</p>
              <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.95] tracking-tight text-ink [text-wrap:balance]">
                {text("corporate.headline")} <span className="text-brand">{text("corporate.accent")}</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65">{text("corporate.sub")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#brief"
                  className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright"
                >
                  Send the brief →
                </a>
                <a
                  href={settings.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-bold text-ink/75 transition-colors hover:border-ink hover:text-ink"
                >
                  Talk to us on WhatsApp
                </a>
              </div>
            </div>

            {/* the email every team member gets to set */}
            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              {hero && (
                <div className="absolute -right-1 top-0 z-20 w-28 rotate-6 bg-white p-2 pb-7 shadow-card-lg sm:-right-8 sm:w-44">
                  <div className="relative aspect-square overflow-hidden">
                    <SiteMedia src={hero} alt="A Tripwaley group on a mountain trip" fill sizes="192px" className="object-cover" />
                  </div>
                  <p className="mt-1.5 text-center font-script text-base text-ink/70 sm:text-lg">where the team is</p>
                </div>
              )}
              <div className="relative z-10 mt-24 overflow-hidden rounded-2xl border border-line bg-card shadow-card-lg">
                <div className="flex items-center gap-1.5 border-b border-line bg-cream px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  <span className="ml-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink/55">automatic reply</span>
                </div>
                <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 border-b border-line px-5 py-4 text-[0.85rem]">
                  <dt className="text-ink/50">From</dt>
                  <dd className="font-bold text-ink">The whole team</dd>
                  <dt className="text-ink/50">Subject</dt>
                  <dd className="font-bold text-ink">Out of office (all of us)</dd>
                </dl>
                <div className="space-y-3 px-5 py-5 text-[0.95rem] leading-relaxed text-ink/75">
                  <p>Hi,</p>
                  <p>
                    We&apos;re away together until Monday — somewhere with a long table, a bonfire and patchy network.
                  </p>
                  <p>If it&apos;s urgent, it can probably wait.</p>
                  <p className="font-script text-2xl text-brand">— sent from the hills</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- the formats, as calendar blocks ---------- */}
        {formats.length > 0 && (
          <section className="bg-ink px-5 py-[10vh] sm:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <p className="font-script text-2xl text-gold sm:text-3xl">block the calendar</p>
              <h2 className="mt-2 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl [text-wrap:balance]">
                Four kinds of trip. Each one built around your team.
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {formats.map((f) => (
                  <article key={f.title} className="flex flex-col rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                    {f.span && <p className="font-mono text-xs uppercase tracking-[0.15em] text-gold">{f.span}</p>}
                    <h3 className="mt-2 font-display text-xl font-extrabold text-white">{f.title}</h3>
                    <p className="mt-2.5 text-[0.9rem] leading-relaxed text-white/60">{f.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------- a day, as an agenda ---------- */}
        <section className="px-5 py-[10vh] sm:px-8">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the agenda</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl [text-wrap:balance]">
                Same team. <span className="text-brand">Different calendar.</span>
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-ink/65">
                A sample offsite day. Yours gets planned around what the team actually needs — a working session, or none at all.
              </p>
            </div>
            <ol className="divide-y divide-line rounded-2xl border border-line bg-card">
              {AGENDA.map((a) => (
                <li key={a.at} className="grid grid-cols-[4rem_1fr] gap-4 px-5 py-4 sm:grid-cols-[5rem_1fr]">
                  <span className="font-mono text-sm tabular-nums text-ink/50">{a.at}</span>
                  <span>
                    <s className="block text-sm text-ink/50 decoration-brand decoration-2">{a.was}</s>
                    <span className="mt-0.5 block font-bold text-ink">{a.now}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- where teams go ---------- */}
        {places.length > 0 && (
          <section className="bg-blush px-5 py-[10vh] sm:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                  Where teams go
                </h2>
                <p className="max-w-xs text-sm leading-relaxed text-ink/65">
                  Places we already run trips to — so the stays, roads and people are known to us.
                </p>
              </div>
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {places.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/destinations/${d.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink">
                      <SiteMedia
                        src={d.image}
                        alt={d.name}
                        fill
                        sizes="(min-width:1024px) 25vw, 50vw"
                        className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-4">
                        <span className="block font-display text-lg font-extrabold leading-tight text-white sm:text-xl">{d.name}</span>
                        <span className="mt-0.5 block text-xs text-white/70">{d.state}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ---------- what's handled ---------- */}
        <section className="px-5 py-[10vh] sm:px-8">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="font-script text-2xl text-brand sm:text-3xl">you send the headcount</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                We handle the rest.
              </h2>
              <ul className="mt-8 space-y-4">
                {handled.map((t) => (
                  <li key={t} className="flex gap-3 text-[0.98rem] leading-relaxed text-ink/75">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-brand">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              {boarding.length > 1 && (
                <p className="mt-8 text-sm leading-relaxed text-ink/65">
                  We already board group trips from{" "}
                  <strong className="text-ink">{boarding.map((c) => c.name).join(", ")}</strong>.
                </p>
              )}
            </div>
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {gallery.map((src, i) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-2xl ${i % 3 === 0 ? "aspect-[4/5]" : "aspect-square"} ${i === 1 ? "mt-8" : ""}`}
                  >
                    <SiteMedia src={src} alt="A Tripwaley group trip" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------- how it goes ---------- */}
        <section className="border-y border-line px-5 py-[8vh] sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">How it goes</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Send the brief", "Headcount, rough dates, a budget per head. Five minutes."],
                ["Get the routes", "Within one working day — options to choose from, costed for your group."],
                ["Lock the dates", "Pick one, confirm the headcount, and we start booking."],
                ["We run it", "A captain travels with the team. You get to be on the trip, not running it."],
              ].map(([t, d], i) => (
                <li key={t}>
                  <span className="font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1.5 font-display text-lg font-extrabold text-ink">{t}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink/65">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <CorporateQuoteForm
          title={text("corporate.formTitle")}
          sub={text("corporate.formSub")}
          whatsappLink={settings.whatsappLink}
          formats={formats.map((f) => f.title)}
        />

        {/* ---------- questions ---------- */}
        <section className="px-5 py-[10vh] sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Questions HR asks us</h2>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink">
                    {f.q}
                    <span aria-hidden="true" className="text-xl text-brand transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/70">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink/65">
              Anything else?{" "}
              <Link href="/team#faqs" className="font-bold text-brand underline-offset-4 hover:underline">
                The general FAQs are on the Paltan page →
              </Link>
            </p>
          </div>
        </section>

        <CtaBand
          whatsappLink={settings.whatsappLink}
          script="the whole team, out of office"
          title="Send us the headcount. We'll send back the routes."
        />
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
