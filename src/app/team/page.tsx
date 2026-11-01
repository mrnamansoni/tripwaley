import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import SiteFooter from "@/components/site/SiteFooter";
import { SafetyBand, CtaBand } from "@/components/site/PageExtras";
import { getCaptains, getCities, getSettings, getLivePackages, getPricedCities, getFaqs, slotOne, holdRates } from "@/lib/catalog";
import { canonical } from "@/lib/seo";

/* THE PALTAN — who we are and who runs your trip, on one page.
   Replaces /about (which now redirects here) and absorbs the captains band.
   Three ideas carry it, each from the world of a group trip:
     · the word itself, set as a dictionary entry
     · the origin story told as the group chat every friend group has
     · the captains as a school-trip roll call on ruled notebook paper
   Every number on the page is counted from the catalog — nothing typed in. */

export const metadata: Metadata = {
  ...canonical("/team"),
  title: "Meet the Paltan — the crew behind Tripwaley",
  description:
    "Who runs Tripwaley: the trip captains who lead every batch, how a batch works, how we keep you safe, and the answers to the questions people ask at 2 AM.",
};

/* the chat that never becomes a trip — illustrative, not a real group */
const CHAT: { who: string; text: string; me?: boolean }[] = [
  { who: "Rohan", text: "GOA THIS DECEMBER. no excuses this time 🌴" },
  { who: "Priya", text: "in!!!" },
  { who: "Kabir", text: "in. but only after the 20th" },
  { who: "Sneha", text: "what's the budget" },
  { who: "Rohan", text: "ok who's booking" },
  { who: "you", text: "…", me: true },
];

export default function TeamPage() {
  const settings = getSettings();
  const faqs = getFaqs();
  const captains = getCaptains();
  const tripsLed = captains.reduce((n, c) => n + c.trips, 0);
  const summary = [
    { n: captains.length, l: captains.length === 1 ? "captain on the roll" : "captains on the roll" },
    { n: tripsLed, l: "trips led between them" },
    { n: getLivePackages().length, l: "trips on sale now" },
    { n: getPricedCities().length, l: "cities we board from" },
  ].filter((s) => s.n > 0);

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        {/* ---------- the word ---------- */}
        <section className="relative overflow-hidden bg-ink px-5 pb-20 pt-36 sm:px-8 sm:pb-24">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.35em] text-white/55">the team page, sort of</p>
              <h1 className="mt-4 font-display text-[clamp(4.5rem,15vw,10rem)] font-extrabold leading-[0.85] tracking-tight text-white">
                paltan<span className="text-brand">.</span>
              </h1>
              <p className="mt-4 font-mono text-sm text-gold">/pəl·ʈən/ &nbsp;·&nbsp; noun, Hindi</p>
              <ol className="mt-6 max-w-xl space-y-3 text-lg leading-relaxed text-white/80">
                <li className="flex gap-3">
                  <span className="font-mono text-sm text-white/45">1.</span>
                  <span>a platoon.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-sm text-white/45">2.</span>
                  <span>a loud, loyal gang that goes everywhere together.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-sm text-white/45">3.</span>
                  <span>
                    the people who plan, run and captain every Tripwaley batch.{" "}
                    <em className="font-script text-2xl not-italic text-gold">us.</em>
                  </span>
                </li>
              </ol>
              <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-white/50">
                used in a sentence: &ldquo;bhai, poori paltan aa rahi hai.&rdquo;
              </p>
            </div>
            {/* a polaroid of the crew, pinned at an angle */}
            <figure className="mx-auto w-full max-w-sm rotate-3 rounded-sm bg-white p-3 pb-12 shadow-card-lg transition-transform duration-500 hover:rotate-0">
              <div className="relative aspect-[4/5] overflow-hidden">
                <SiteMedia src={slotOne("about.crew")} alt="A Tripwaley batch together in the mountains" fill sizes="(max-width:1024px) 80vw, 24rem" className="object-cover" />
              </div>
              <figcaption className="mt-3 text-center font-script text-2xl text-ink">strangers on day one. this, by day six.</figcaption>
            </figure>
          </div>
        </section>

        {/* ---------- the origin story, as the chat it came from ---------- */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-sm overflow-hidden rounded-[1.75rem] border border-line bg-[#efe7dd] shadow-card-lg" aria-label="An example group chat">
              <div className="flex items-center gap-3 bg-[#1f3b35] px-4 py-3 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg" aria-hidden="true">🌴</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Goa 2027 pakka 🌴🌴</p>
                  <p className="truncate text-[0.7rem] text-white/65">Rohan, Priya, Kabir, Sneha, you +7</p>
                </div>
              </div>
              <div className="space-y-2 px-3 py-4">
                <p className="mx-auto w-fit rounded-md bg-white/70 px-2.5 py-1 text-center text-[0.65rem] text-ink/60">
                  Rohan renamed the group from &ldquo;Goa 2026 pakka&rdquo;
                </p>
                {CHAT.map((m, i) => (
                  <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[80%] rounded-xl px-3 py-1.5 text-sm shadow-sm ${m.me ? "bg-[#d9fdd3] text-ink" : "bg-white text-ink"}`}>
                      {!m.me && <span className="block text-[0.68rem] font-bold text-brand">{m.who}</span>}
                      {m.text}
                    </p>
                  </div>
                ))}
                <p className="pt-1 text-center text-[0.65rem] text-ink/50">seen by 11 · last message 3 months ago</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="font-script text-2xl text-brand sm:text-3xl">the origin story, short version</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              We got tired of trips that <span className="text-brand">stayed in the chat.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70">
              You&apos;ve been in this group. Everyone is in, nobody books, and the trip quietly
              dies in a thread. Tripwaley is the fix: fixed dates, batches that go, a captain who
              runs the whole thing, and buses that board in your own city — not just Delhi.
              You only have to say &ldquo;in&rdquo; once.
            </p>
          </div>
        </section>

        {/* ---------- roll call ---------- */}
        {captains.length > 0 && (
          <section className="notebook border-y border-line py-16 sm:py-20">
            <div className="mx-auto w-full max-w-5xl pl-16 pr-5 sm:pl-24 sm:pr-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-script text-2xl text-brand">attendance register · trip captains</p>
                  <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Roll call.</h2>
                </div>
                <p className="max-w-xs font-script text-xl leading-snug text-ink/70">
                  Every batch ships with one of these. Present, every time.
                </p>
              </div>

              <ol className="mt-10 space-y-6">
                {captains.map((c, i) => (
                  <li key={c.slug || c.name} className="grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[auto_auto_1fr_auto] sm:gap-6">
                    <figure className={`relative w-24 bg-white p-1.5 pb-5 shadow-card sm:w-28 ${i % 2 ? "rotate-2" : "-rotate-2"}`}>
                      <div className="relative aspect-square overflow-hidden">
                        <SiteMedia src={c.photo} alt={`Captain ${c.name}`} fill sizes="112px" className="object-cover" />
                      </div>
                      <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rotate-[-4deg] bg-gold/50" />
                    </figure>
                    <p aria-hidden="true" className="hidden font-mono text-xs text-ink/45 sm:block">
                      roll no. {String(i + 1).padStart(2, "0")}
                    </p>
                    <div className="min-w-0">
                      <p className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">Captain {c.name}</p>
                      {c.beat && <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-brand">{c.beat}</p>}
                      {c.line && <p className="mt-1 font-script text-xl leading-snug text-ink/75">{c.line}</p>}
                      <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink/55 sm:hidden">{c.trips} trips led</p>
                    </div>
                    <div className="hidden items-center gap-4 sm:flex">
                      <p className="text-right">
                        <span className="block font-script text-4xl leading-none text-ink">{c.trips}</span>
                        <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink/55">trips led</span>
                      </p>
                      {/* the red-pen P, drawn as you reach the row */}
                      <svg viewBox="0 0 48 48" className="roll-tick h-12 w-12 text-brand" aria-label="present">
                        <path d="M14 40 L14 9 C 26 6, 36 11, 34 19 C 32 26, 22 26, 15 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength={60} />
                      </svg>
                    </div>
                  </li>
                ))}
              </ol>

              {summary.length > 0 && (
                <dl className="mt-12 grid grid-cols-2 gap-6 border-t-2 border-double border-ink/25 pt-6 sm:grid-cols-4">
                  {summary.map((s) => (
                    <div key={s.l}>
                      <dt className="sr-only">{s.l}</dt>
                      <dd>
                        <span className="block font-display text-4xl font-extrabold tracking-tight text-ink tabular-nums">{s.n}</span>
                        <span className="font-script text-lg text-ink/65">{s.l}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        )}

        {/* ---------- paltan rules ---------- */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <p className="font-script text-2xl text-brand">how a batch works</p>
          <h2 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Three paltan <span className="text-brand">rules.</span>
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { t: "Say in, once.", d: `Pick a trip and a date and reserve a seat free for 24 hours, then hold it with ${holdRates().holdPercent}% of the trip price — on the site or over WhatsApp.` },
              { t: "Join the thread.", d: "You're added to the batch's WhatsApp group with your captain. Packing lists, pickup points, playlists — all handled there." },
              { t: "Just show up.", d: "Board in your own city. Stays, transport, permits, chai stops — the captain runs it, you live it." },
            ].map((s, i) => (
              <li key={s.t} className="relative rounded-3xl border border-line bg-card p-7">
                <span aria-hidden="true" className="font-display text-6xl font-extrabold leading-none text-brand/15">{i + 1}</span>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">{s.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <SafetyBand />

        {/* FAQs — refund policy lives here, lowkey */}
        <section id="faqs" className="mx-auto w-full max-w-3xl scroll-mt-24 px-5 py-16 sm:px-8">
          <h2 className="text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            The 2 AM <span className="text-brand">questions.</span>
          </h2>
          <div className="mt-9 divide-y divide-line rounded-3xl border border-line bg-card shadow-sm">
            {faqs.map((f, i) => (
              <details key={f.q} className="group px-6 py-5 sm:px-8" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 font-display text-lg font-extrabold text-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/25 text-lg text-ink/65 transition-all duration-500 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-white" aria-hidden="true">+</span>
                  {f.q}
                </summary>
                <p className="mt-3 pl-12 text-[0.95rem] leading-relaxed text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <CtaBand whatsappLink={settings.whatsappLink} script="roll call's open" title="Join the paltan. Next batch leaves soon." />
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
