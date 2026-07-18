/* Content sections shared by the secondary pages (destinations, collections,
   vibe-check, about). Server components — the only client child is the live
   WeatherNow card. */

import Image from "next/image";
import Link from "next/link";
import WeatherNow from "./WeatherNow";
import { slot } from "@/lib/catalog";

/* ---------------------------------------------- live weather strip (L46) */

const STATIONS = [
  { place: "Manali", lat: 32.2432, lng: 77.1892 },
  { place: "Chopta", lat: 30.3345, lng: 79.3306 },
  { place: "Srinagar", lat: 34.0837, lng: 74.7973 },
];

export function WeatherStrip() {
  return (
    <section className="bg-[#101013] py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Live from the <span className="text-gold">mountains.</span>
          </h2>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">real weather · updates hourly</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {STATIONS.map((s) => (
            <WeatherNow key={s.place} lat={s.lat} lng={s.lng} place={s.place} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------- seasons cheat-sheet */

const SEASONS = [
  { months: "Dec — Feb", name: "Snow season", go: "Kedarkantha · Manali · Gulmarg", note: "Summits at sunrise, snowball diplomacy by noon." },
  { months: "Mar — Jun", name: "The classic window", go: "Himachal · Kashmir · Rishikesh", note: "Everything open, everything green, rivers running loud." },
  { months: "Jul — Sep", name: "Monsoon magic", go: "Valley of Flowers · Spiti (rain-shadow)", note: "The crowds leave. The waterfalls don't." },
  { months: "Oct — Nov", name: "Clear-sky season", go: "Parvati Valley · Rajasthan · Goa", note: "Post-monsoon visibility — the Milky Way month." },
];

export function SeasonsBand() {
  return (
    <section className="bg-cream py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          When to go <span className="text-brand">where.</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEASONS.map((s) => (
            <div key={s.name} className="group relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg">
              <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.25em] text-gold">{s.months}</p>
              <p className="mt-2 font-display text-xl font-extrabold text-ink">{s.name}</p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-brand">{s.go}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/60">{s.note}</p>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------- captains band */

const CAPTAINS = [
  { name: "Tenzin", trips: 147, beat: "High Himalaya", line: "Notices altitude sickness before you do.", img: "/images/group-trek.jpg" },
  { name: "Aisha", trips: 96, beat: "Himachal circuits", line: "Runs the tightest playlist democracy in the Volvo.", img: "/images/traveller-street.jpg" },
  { name: "Veer", trips: 121, beat: "Treks & summits", line: "Carries a guitar to 4,000m. Uses it responsibly.", img: "/images/camp-tents.jpg" },
];

export function CaptainsBand() {
  const captainImgs = slot("captains");
  return (
    <section className="bg-blush py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            The <span className="text-brand">captains.</span>
          </h2>
          <p className="max-w-xs text-sm text-ink/55">Every batch ships with one. Trained, certified, chronically early.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {CAPTAINS.map((c, i) => (
            <figure key={c.name} className="group overflow-hidden rounded-3xl border border-line bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg">
              <div className="relative h-44 overflow-hidden">
                <Image src={captainImgs[i] ?? c.img} alt="" fill sizes="(max-width:640px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                <span className="absolute bottom-3 left-4 rounded-full bg-ink/60 px-3 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  {c.trips} trips led
                </span>
              </div>
              <figcaption className="p-5">
                <p className="font-display text-xl font-extrabold text-ink">Captain {c.name}</p>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-brand">{c.beat}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{c.line}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------- safety band */

const SAFETY = [
  { t: "Live location", d: "Family link for every batch — parents watch the bus move." },
  { t: "Verified stays", d: "Every property visited by our team before your batch does." },
  { t: "Women-first options", d: "Women-only dorms and women captains on request." },
  { t: "24/7 ops desk", d: "A human answers at 3 AM. Usually before the second ring." },
];

export function SafetyBand() {
  return (
    <section className="bg-ink py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Boring about <span className="text-gold">safety.</span> Proudly.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAFETY.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="font-mono text-[0.62rem] font-bold text-gold">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 font-display text-lg font-extrabold text-white">{s.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------- month picker band */

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthsBand() {
  return (
    <section className="bg-cream py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 text-center sm:px-8">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Or just pick a <span className="text-brand">month.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/55">
          Batches run every week of the year. Tell us when you can escape — we&apos;ll show you where to.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {MONTHS.map((m) => (
            <Link
              key={m}
              href="/trips"
              className="inline-flex min-h-12 items-center rounded-full border-2 border-ink/15 px-7 py-3 font-display text-base font-extrabold text-ink transition-all hover:border-brand hover:bg-brand hover:text-white"
            >
              {m} &apos;26
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------- closing CTA band */

export function CtaBand({ whatsappLink, title, script }: { whatsappLink: string; title: string; script: string }) {
  return (
    <section className="relative overflow-hidden bg-brand py-[11vh]">
      <p aria-hidden="true" className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[22vw] font-extrabold leading-none text-white/[0.07] sm:text-[16vw]">
        tripwaley
      </p>
      <div className="relative mx-auto max-w-2xl px-5 text-center">
        <p className="font-script text-2xl text-gold sm:text-3xl">{script}</p>
        <h2 className="mt-2 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">{title}</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/trips" className="inline-flex min-h-12 items-center rounded-full bg-white px-8 py-4 font-bold text-brand transition-transform hover:scale-[1.04]">
            See all departures →
          </Link>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-full border-2 border-white/40 px-7 py-4 font-bold text-white transition-colors hover:border-gold hover:text-gold">
            WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
