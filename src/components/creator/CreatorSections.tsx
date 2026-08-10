/* Server-rendered sections shared by the creator hub and the creator pages.
   No hooks, no client JS — the calendar is the only interactive island. */

import Link from "next/link";
import SiteMedia from "@/components/site/SiteMedia";
import CreatorFigure, { CreatorAvatar } from "./CreatorFigure";
import DayChips from "@/components/site/DayChips";
import { inr } from "@/lib/types";
import type { Creator, Meal } from "@/lib/types";

/* ------------------------------------------------ the roster ---------- */

export function CreatorRoster({
  creators,
  dateCounts,
}: {
  creators: Creator[];
  dateCounts: Record<string, number>;
}) {
  if (!creators.length) return null;
  return (
    <section id="creators" className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className="font-script text-2xl text-brand sm:text-3xl">pick your person</p>
        <h2 className="mt-2 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Whose trip are you <span className="text-brand">gatecrashing?</span>
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => {
            const count = dateCounts[c.slug] ?? 0;
            const accent = c.accent === "brand" ? "text-brand" : "text-gold";
            return (
              <Link
                key={c.slug}
                href={`/travel-with/${c.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-card-lg"
              >
                <div className="relative h-72 overflow-hidden bg-ink">
                  <SiteMedia
                    src={c.portrait}
                    alt={c.name}
                    fill
                    sizes="(max-width:640px) 92vw, (max-width:1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                    style={{ objectPosition: c.focal ?? "50% 30%" }}
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white backdrop-blur-sm">
                    {c.niche}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className={`font-mono text-[0.6rem] tracking-widest ${accent}`}>{c.handle}</p>
                    <h3 className="mt-0.5 font-display text-2xl font-extrabold leading-tight text-white">{c.name}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-5">
                  <p className="min-w-0 flex-1 text-sm leading-snug text-ink/60">{c.tagline}</p>
                  <span className="shrink-0 text-right">
                    <span className={`block font-display text-2xl font-extrabold leading-none ${accent}`}>{count}</span>
                    <span className="text-[0.5rem] font-bold uppercase tracking-widest text-ink/40">
                      {count === 1 ? "date" : "dates"}
                    </span>
                  </span>
                </div>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ how it works -------- */

const STEPS = [
  { n: "01", t: "Pick a creator, pick a date", d: "Every date on this page is a real batch with a real bus. The creator is booked on it the same way you are." },
  { n: "02", t: "Book the seat, not a meet-and-greet", d: "You're on the same trip: same stays, same jeep, same dhaba stops. Nobody gets a VIP lane." },
  { n: "03", t: "Show up. That's genuinely it", d: "Boarding city to boarding city is handled — stays, transport, permits, captain. Bring a jacket." },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-ink py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          It&apos;s a normal trip. <span className="text-gold">They&apos;re just on it.</span>
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-ink p-7">
              <span className="font-display text-5xl font-extrabold leading-none text-gold/25">{s.n}</span>
              <h3 className="mt-4 font-display text-xl font-extrabold text-white">{s.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ creator's perks ----- */

export function PerksBand({ creator, figure }: { creator: Creator; figure?: string }) {
  if (!creator.perks.length) return null;
  const accent = creator.accent === "brand" ? "text-brand" : "text-gold";
  return (
    <section className="bg-blush py-[10vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        {/* the "arms out" frame: figure centre-left, list flanking it */}
        <div className="relative mx-auto h-[26rem] w-full max-w-sm lg:h-[34rem]">
          <CreatorFigure
            cutout={figure}
            portrait={creator.portrait}
            focal={creator.focal}
            alt={creator.name}
            variant="panel"
            className="h-full w-full"
          />
        </div>
        <div>
          <p className="font-script text-2xl text-brand sm:text-3xl">why it&apos;s different with them</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            What you actually get<br />
            <span className={accent}>because {creator.firstName}&apos;s there.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {creator.perks.map((p, i) => (
              <li key={p} className="flex gap-4 rounded-2xl border border-ink/8 bg-card p-4 shadow-sm">
                <span className={`font-display text-lg font-extrabold leading-none ${accent}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[0.95rem] leading-relaxed text-ink/70">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ in their words ------ */

export function InTheirWords({ creator }: { creator: Creator }) {
  if (!creator.qa.length && !creator.quote) return null;
  return (
    <section className="relative overflow-hidden bg-ink py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8">
        {creator.quote && (
          <figure className="border-l-2 border-gold pl-6 sm:pl-10">
            <blockquote className="font-display text-2xl font-extrabold leading-snug text-white sm:text-4xl">
              &ldquo;{creator.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-gold">
              {creator.handle}
            </figcaption>
          </figure>
        )}

        {creator.qa.length > 0 && (
          <div className="mt-14">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.35em] text-white/40">
              things people actually DM {creator.firstName.toLowerCase()}
            </p>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {creator.qa.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-extrabold text-white transition-colors hover:text-gold">
                    {item.q}
                    <span aria-hidden="true" className="shrink-0 text-gold transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-white/60">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------ their gallery ------- */

export function CreatorGallery({ creator }: { creator: Creator }) {
  if (!creator.gallery.length) return null;
  return (
    <section className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Shot on the road, <span className="text-brand">not in a studio.</span>
          </h2>
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.3em] text-ink/40">
            from {creator.handle}
          </p>
        </div>

        {/* deliberately uneven: a tidy grid of equal squares reads like stock */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {creator.gallery.slice(0, 6).map((src, i) => (
            <figure
              key={`${src}-${i}`}
              className={`relative overflow-hidden rounded-2xl shadow-card ${
                i === 0 ? "col-span-2 row-span-2 aspect-square lg:aspect-auto" : "aspect-[4/5]"
              } ${i === 3 ? "lg:mt-8" : ""}`}
            >
              <SiteMedia
                src={src}
                alt=""
                fill
                sizes="(max-width:640px) 46vw, 24vw"
                className="object-cover transition-transform duration-[1.2s] hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ a creator's trips ---

   One card per package they run, each linking to its own page. This is the
   fix for a creator with several trips: previously the profile explained
   only the soonest one and the rest were dates with no story attached. */

export function CreatorTripCards({
  creator,
  trips,
}: {
  creator: Creator;
  trips: CreatorTripCardData[];
}) {
  const accent = creator.accent === "brand" ? "text-brand" : "text-gold";

  return (
    <section id="trips" className="relative overflow-hidden bg-[#0d0b09] py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-gold">the trips</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Where {creator.firstName}&apos;s <span className={accent}>actually going.</span>
        </h2>

        {trips.length === 0 ? (
          <p className="mt-8 max-w-md text-white/55">
            {creator.firstName}&apos;s next trips aren&apos;t up yet — message us and we&apos;ll tell you the
            moment they are.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {trips.map((t) => {
              const soldOut = t.seatsLeft <= 0;
              return (
                <Link
                  key={t.packageSlug}
                  href={`/travel-with/${creator.slug}/${t.packageSlug}`}
                  className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/50"
                >
                  <div className="relative h-56 overflow-hidden">
                    <SiteMedia
                      src={t.heroMedia}
                      alt={t.headline}
                      fill
                      sizes="(max-width:1024px) 92vw, 44vw"
                      className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white backdrop-blur-sm">
                      {t.dateCount} {t.dateCount === 1 ? "date" : "dates"}
                    </span>
                    {soldOut && (
                      <span className="absolute right-4 top-4 -rotate-6 rounded border-2 border-white/45 px-2 py-0.5 font-display text-[0.6rem] font-extrabold uppercase tracking-widest text-white/70">
                        sold out
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl font-extrabold leading-tight text-white group-hover:text-gold">
                      {t.headline}
                    </h3>
                    {t.pitch && <p className="mt-2 font-script text-lg leading-snug text-gold/85">&ldquo;{t.pitch}&rdquo;</p>}

                    {/* the actual dates, so the card answers "when" without a click */}
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {t.dateLabels.map((d) => (
                        <li key={d} className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-white/60">
                          {d}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                      <span>
                        {t.price != null && (
                          <>
                            <span className="block font-display text-2xl font-extrabold text-white">{inr(t.price)}</span>
                            <span className="font-mono text-[0.5rem] uppercase tracking-widest text-white/40">per seat</span>
                          </>
                        )}
                      </span>
                      <span className="text-right">
                        <span className={`block font-mono text-[0.58rem] uppercase tracking-widest ${soldOut ? "text-white/35" : "text-gold"}`}>
                          {soldOut ? "waitlist" : `${t.seatsLeft} seats left`}
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-white group-hover:text-gold">
                          See this trip →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export interface CreatorTripCardData {
  packageSlug: string;
  headline: string;
  pitch?: string;
  heroMedia: string;
  price?: number;
  seatsLeft: number;
  dateCount: number;
  dateLabels: string[];
}

/* ------------------------------------------------ itinerary beside ----

   The creator stands on one side and their trip runs down the other. The
   figure is sticky, so it holds the frame while the days scroll past it —
   which is what makes it feel like they're walking you through the route
   rather than sitting in a hero image. */

export function ItineraryBeside({
  creator,
  figure,
  packageName,
  days,
}: {
  creator: Creator;
  figure?: string;
  packageName: string;
  days: { day: number; title: string; body: string; meals?: Meal[]; stay?: boolean }[];
}) {
  if (!days.length) return null;
  const accent = creator.accent === "brand" ? "text-brand" : "text-gold";
  const rule = creator.accent === "brand" ? "bg-brand" : "bg-gold";

  return (
    <section className="relative overflow-hidden bg-ink py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* the figure — sticky on desktop, a normal block on phones */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.35em] text-white/40">
            {creator.firstName} walks you through
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            {packageName}
          </h2>
          <span className={`mt-4 block h-px w-16 ${rule}`} aria-hidden="true" />
          <div className="relative mt-6 h-[24rem] w-full sm:h-[30rem]">
            <CreatorFigure
              cutout={figure}
              portrait={creator.portrait}
              focal={creator.focal}
              alt={creator.name}
              variant="panel"
              className="h-full w-full"
            />
          </div>
        </div>

        {/* the days */}
        <ol className="space-y-4">
          {days.map((d) => (
            <li key={d.day} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 sm:p-6">
              <div className="flex items-baseline gap-4">
                <span className={`font-display text-2xl font-extrabold leading-none ${accent}`}>
                  {String(d.day).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-extrabold leading-snug text-white">{d.title}</h3>
              </div>
              <DayChips meals={d.meals} stay={d.stay} tone="dark" className="mt-3 pl-10" />
              {d.body && (
                <p className="mt-2.5 whitespace-pre-line pl-10 text-sm leading-relaxed text-white/55">{d.body}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------ in / out flank ------

   The creator in the middle with what's covered on one side and what isn't
   on the other — the layout reads as them holding the two lists apart. With
   a real cutout the arms frame the columns; with a photo panel the same
   three-column rhythm still works. */

function FlankColumn({
  items,
  label,
  tone,
  align,
}: {
  items: string[];
  label: string;
  tone: "in" | "out";
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "lg:text-right" : ""}>
      <p
        className={`font-mono text-[0.56rem] uppercase tracking-[0.35em] ${
          tone === "in" ? "text-success" : "text-brand-bright"
        }`}
      >
        {label}
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((t) => (
          <li
            key={t}
            className={`flex gap-3 text-sm leading-relaxed text-white/70 ${
              align === "right" ? "lg:flex-row-reverse lg:text-right" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 shrink-0 font-bold ${tone === "in" ? "text-success" : "text-brand-bright"}`}
            >
              {tone === "in" ? "✓" : "✕"}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InOutFlank({
  creator,
  figure,
  inclusions,
  exclusions,
}: {
  creator: Creator;
  figure?: string;
  inclusions: string[];
  exclusions: string[];
}) {
  if (!inclusions.length && !exclusions.length) return null;

  return (
    <section className="relative overflow-hidden bg-[#0d0b09] py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          What&apos;s in, <span className="text-gold">what&apos;s not.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/50">
          No asterisks. If it isn&apos;t on the left, you&apos;re paying for it.
        </p>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <FlankColumn items={inclusions} label="covered" tone="in" align="right" />

          <div className="relative mx-auto h-[22rem] w-56 sm:h-[30rem] sm:w-72">
            <CreatorFigure
              cutout={figure}
              portrait={creator.portrait}
              focal={creator.focal}
              alt={creator.name}
              variant="panel"
              className="h-full w-full"
            />
            {/* a warm floor glow so the middle column anchors visually */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-30%] bottom-[-8%] h-24 rounded-[50%] blur-2xl"
              style={{ background: "radial-gradient(ellipse, rgba(245,163,26,0.28), transparent 70%)" }}
            />
          </div>

          <FlankColumn items={exclusions} label="not covered" tone="out" align="left" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ creator strip ------- */

export function CreatorStrip({ creators }: { creators: Creator[] }) {
  if (!creators.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex -space-x-3">
        {creators.slice(0, 5).map((c) => (
          <CreatorAvatar
            key={c.slug}
            src={c.portrait}
            focal={c.focal}
            alt={c.name}
            size={44}
            ring="ring-cream"
          />
        ))}
      </div>
      <p className="text-sm text-white/60">
        <span className="font-bold text-white">{creators.length} creators</span> riding along this season
      </p>
    </div>
  );
}
