/* Shared building blocks for the three trip-type landing pages.
 *
 * All server components — no hooks, no client JS. The reveal animations are
 * pure CSS (see .tt-rise in globals.css), so these pages cost nothing on the
 * main thread beyond the one <TripTypeGrid> island that needs the city.
 *
 * Every photo here is a media ref, so the owner can swap any of them for a
 * video from the admin Media tab without touching this file.
 */

import Link from "next/link";
import SiteMedia from "./SiteMedia";

/* ------------------------------------------------ parsing helpers */

/** "Title | detail" per line → cards. Lines without a pipe become title-only. */
export function parsePromises(raw: string): { title: string; detail: string }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|");
      return i === -1
        ? { title: l, detail: "" }
        : { title: l.slice(0, i).trim(), detail: l.slice(i + 1).trim() };
    });
}

export const parseLines = (raw: string): string[] =>
  raw.split("\n").map((l) => l.trim()).filter(Boolean);

/* ------------------------------------------------ hero */

/** Legibility scrim: dark behind the copy, clear over the rest of the photo.
 *  `tint` is the per-page mood layer painted on top of it. */
export const heroScrim = (tint: string): string =>
  `${tint}, linear-gradient(to right, rgba(26,22,20,0.92) 0%, rgba(26,22,20,0.66) 34%, rgba(26,22,20,0.14) 76%), linear-gradient(to top, rgba(26,22,20,0.75) 0%, rgba(26,22,20,0) 55%)`;

export interface HeroTheme {
  /** full background-image stack — build it with heroScrim() */
  scrim: string;
  eyebrow: string;
  accent: string;
  sub: string;
  primaryBtn: string;
  ghostBtn: string;
  /** thin rule under the eyebrow */
  rule: string;
}

export function TripTypeHero({
  media,
  eyebrow,
  headline,
  accent,
  sub,
  theme,
  stats,
  primaryHref = "#trips",
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  media: string;
  eyebrow: string;
  headline: string;
  accent: string;
  sub: string;
  theme: HeroTheme;
  stats: { value: string; label: string }[];
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  // A counter reading "0 upcoming batches" advertises the wrong thing — drop
  // any stat that has nothing to report rather than printing a zero.
  const shownStats = stats.filter((s) => s.value !== "0" && s.value.trim() !== "");

  return (
    <section className="relative min-h-[86vh] overflow-hidden">
      <SiteMedia src={media} alt="" fill priority sizes="100vw" className="object-cover" />

      {/* One scrim element carrying two stacked gradients: a directional one
          that is dark only where the copy sits (so the photo keeps its detail
          everywhere else), plus the theme's mood tint. A single flat wash
          strong enough to carry white text greys the whole picture out —
          badly on shots with a bright centre. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: theme.scrim }} />

      <div className="relative mx-auto flex min-h-[86vh] w-full max-w-6xl flex-col justify-end px-5 pb-16 pt-36 sm:px-8">
        <p className={`tt-rise font-script text-2xl sm:text-3xl ${theme.eyebrow}`}>{eyebrow}</p>
        <span className={`tt-rise tt-d1 mt-3 block h-px w-16 ${theme.rule}`} aria-hidden="true" />
        <h1 className="tt-rise tt-d1 mt-5 max-w-4xl font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          {headline}
          <span className={`block ${theme.accent}`}>{accent}</span>
        </h1>
        <p className={`tt-rise tt-d2 mt-5 max-w-xl text-[0.95rem] leading-relaxed sm:text-base ${theme.sub}`}>{sub}</p>

        <div className="tt-rise tt-d3 mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            className={`inline-flex min-h-12 items-center rounded-full px-7 py-3 text-sm font-extrabold transition-all active:scale-[0.98] ${theme.primaryBtn}`}
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <a
              href={secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-12 items-center rounded-full border px-6 py-3 text-sm font-bold transition-colors ${theme.ghostBtn}`}
            >
              {secondaryLabel}
            </a>
          )}
        </div>

        {shownStats.length > 0 && (
          <dl className="tt-rise tt-d3 mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
            {shownStats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-2xl font-extrabold text-white sm:text-3xl">{s.value}</span>
                  <span className="mt-0.5 block text-[0.58rem] font-bold uppercase tracking-[0.25em] text-white/50">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------ promise cards */

export function PromiseCards({
  items,
  theme,
}: {
  items: { title: string; detail: string }[];
  theme: { section: string; card: string; num: string; title: string; detail: string };
}) {
  if (!items.length) return null;
  return (
    <section className={`py-[9vh] ${theme.section}`}>
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {items.map((p, i) => (
          <div key={p.title} className={`tt-rise relative overflow-hidden rounded-3xl p-6 ${theme.card}`} style={{ animationDelay: `${i * 70}ms` }}>
            <span aria-hidden="true" className={`font-display text-4xl font-extrabold leading-none ${theme.num}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={`mt-3 font-display text-lg font-extrabold leading-snug ${theme.title}`}>{p.title}</h3>
            {p.detail && <p className={`mt-2 text-sm leading-relaxed ${theme.detail}`}>{p.detail}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------ gallery band */

export function MediaBand({
  media,
  eyebrow,
  headline,
  accent,
  theme,
}: {
  media: string[];
  eyebrow: string;
  headline: string;
  accent: string;
  theme: { section: string; eyebrow: string; heading: string; accent: string };
}) {
  if (!media.length) return null;
  return (
    <section className={`overflow-hidden py-[9vh] ${theme.section}`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className={`text-[0.62rem] font-bold uppercase tracking-[0.45em] ${theme.eyebrow}`}>{eyebrow}</p>
        <h2 className={`mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl ${theme.heading}`}>
          {headline} <span className={theme.accent}>{accent}</span>
        </h2>
      </div>

      {/* free-scrolling strip: no JS, momentum on touch, keyboard reachable */}
      <div
        data-lenis-prevent
        tabIndex={0}
        aria-label="Photo gallery"
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8"
      >
        {media.map((src, i) => (
          <figure
            key={`${src}-${i}`}
            className={`relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-card-lg sm:w-72 ${
              i % 2 ? "sm:translate-y-5" : ""
            }`}
          >
            <SiteMedia src={src} alt="" fill sizes="(max-width:640px) 60vw, 18rem" className="object-cover" />
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------ romantic: arch gallery

   Arches are the oldest shorthand for romance in Indian architecture —
   haveli windows, Mughal jharokhas. Framing the photos this way (rather than
   the square cards every other page uses) is what makes this page read as a
   honeymoon page at a glance, before a word is read. */

export function ArchGallery({
  media,
  eyebrow,
  headline,
  accent,
  captions = [],
}: {
  media: string[];
  eyebrow: string;
  headline: string;
  accent: string;
  captions?: string[];
}) {
  if (!media.length) return null;
  return (
    <section className="relative overflow-hidden bg-cream py-[10vh]">
      {/* candlelight — a single warm pool of light behind the arches */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(245,163,26,0.22), rgba(201,27,32,0.10) 45%, transparent 70%)" }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <p className="font-script text-2xl text-brand sm:text-3xl">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {headline} <span className="text-brand">{accent}</span>
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-3">
          {media.slice(0, 6).map((src, i) => (
            <figure key={`${src}-${i}`} className={`group ${i % 2 ? "lg:mt-12" : ""}`}>
              <div
                className="relative aspect-[3/4] overflow-hidden border border-brand/10 shadow-card-lg transition-transform duration-700 group-hover:-translate-y-2"
                style={{ borderRadius: "50% 50% 0.75rem 0.75rem / 34% 34% 0.75rem 0.75rem" }}
              >
                <SiteMedia
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width:640px) 44vw, (max-width:1024px) 30vw, 22vw"
                  className="object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand/25 via-transparent to-transparent" />
              </div>
              {captions[i] && (
                <figcaption className="mt-3 text-center font-script text-xl text-ink/55">{captions[i]}</figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ romantic: pull quote */

export function LoveNote({ quote, attribution }: { quote: string; attribution: string }) {
  if (!quote.trim()) return null;
  return (
    <section className="bg-blush py-[11vh]">
      <figure className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <span aria-hidden="true" className="font-display text-6xl leading-none text-brand/25">&ldquo;</span>
        <blockquote className="-mt-4 font-script text-3xl leading-snug text-ink sm:text-5xl sm:leading-[1.15]">
          {quote}
        </blockquote>
        <figcaption className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.35em] text-ink/40">
          {attribution}
        </figcaption>
      </figure>
    </section>
  );
}

/* ------------------------------------------------ adventurous: trail markers

   Mono type, coordinates and altitudes — the visual language of a route card
   rather than a brochure. Gives the solo page a field-notes edge that the
   honeymoon page deliberately never has. */

export function TrailMarkers({ items }: { items: { label: string; value: string; note: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink py-[8vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 px-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="bg-ink p-6">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.3em] text-gold/70">{m.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-white">{m.value}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/45">{m.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------ feature block */

export function FeatureBlock({
  media,
  title,
  items,
  theme,
  flip = false,
}: {
  media: string;
  title: string;
  items: string[];
  theme: { section: string; heading: string; item: string; tick: string; card: string };
  flip?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className={`py-[9vh] ${theme.section}`}>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-2">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card-lg ${flip ? "lg:order-2" : ""}`}>
          <SiteMedia src={media} alt="" fill sizes="(max-width:1024px) 92vw, 44vw" className="object-cover" />
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <h2 className={`font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl ${theme.heading}`}>
            {title}
          </h2>
          <ul className="mt-7 space-y-3.5">
            {items.map((t) => (
              <li key={t} className={`flex gap-3.5 text-[0.95rem] leading-relaxed ${theme.item}`}>
                <span className={`mt-1 shrink-0 ${theme.tick}`} aria-hidden="true">✦</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
