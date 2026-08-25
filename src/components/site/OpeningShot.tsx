"use client";

/* THE OPENING SHOT — homepage hero.
   Act I  · camera flies through giant type (vector zoom — the scale runs on
            an inner SVG <g>, not the element, so both scroll directions
            re-render crisp with zero raster flicker)
   Act II · letterboxed one-take film scrub with timecode
   Act III· blinds resolve into LIVE departures from the visitor's city.
   Separate landscape / portrait compositions keep phones cinematic. */

import { useEffect, useRef } from "react";
import SiteMedia from "./SiteMedia";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useCity, CitySwitcher } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";

/* generic film-cell captions, cycled onto however many frames the admin
   assigns to the hero.film slot */
const FILM_CAPTIONS = [
  { place: "KEDARKANTHA — 05:12", lens: "24MM · f/8" },
  { place: "KASOL — 21:48", lens: "35MM · f/1.8" },
  { place: "SPITI — 23:58", lens: "14MM · ISO 3200" },
  { place: "LADAKH — 14:20", lens: "50MM · f/4" },
  { place: "KERALA — 07:05", lens: "35MM · f/2" },
  { place: "RAJASTHAN — 17:44", lens: "85MM · f/2.8" },
  { place: "MEGHALAYA — 11:30", lens: "24MM · f/5.6" },
  { place: "ANDAMAN — 06:15", lens: "16MM · f/8" },
];

export default function OpeningShot({
  departures,
  fromPrices,
  heroBg,
  heroFilm,
  heroBlinds,
  whatsappLink,
  eyebrow = "tripwaley presents · a film by you",
  headline = "Your city. Your crew.",
  headlineAccent = "Your opening shot.",
  scrollCue = "scroll — roll camera",
  markWord = "SCENE",
  markSub = "ON HAI",
}: {
  departures: Record<string, { date: string; name: string; slug: string }[]>;
  fromPrices: Record<string, Record<string, number>>;
  heroBg: string;
  heroFilm: string[];
  heroBlinds: string;
  /** from Settings — never hardcode the number, it changes */
  whatsappLink: string;
  eyebrow?: string;
  headline?: string;
  headlineAccent?: string;
  scrollCue?: string;
  markWord?: string;
  markSub?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const tcRef = useRef<HTMLParagraphElement>(null);
  const { city } = useCity();
  const film = heroFilm.map((src, i) => ({ src, ...FILM_CAPTIONS[i % FILM_CAPTIONS.length] }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      const frames = gsap.utils.toArray<HTMLElement>("[data-os-frame]");
      const metas = gsap.utils.toArray<HTMLElement>("[data-os-meta]");
      const slats = gsap.utils.toArray<HTMLElement>("[data-os-slat]");
      slats.forEach((s, i) => gsap.set(s, { yPercent: i % 2 === 0 ? 104 : -104 }));
      gsap.set("[data-os-film]", { autoAlpha: 0 });
      gsap.set("[data-os-live]", { autoAlpha: 0, y: 44 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.45,
          onUpdate: (self) => {
            const f = gsap.utils.clamp(0, 1, (self.progress - 0.28) / 0.42);
            const seg = 1 / heroFilm.length;
            frames.forEach((fr, i) => {
              const active = f >= i * seg && (f < (i + 1) * seg || i === heroFilm.length - 1);
              const local = gsap.utils.clamp(0, 1, (f - i * seg) / seg);
              fr.style.opacity = active ? "1" : "0";
              fr.style.transform = `scale(${1.16 - local * 0.13})`;
              if (metas[i]) metas[i].style.opacity = active ? "1" : "0";
            });
            const total = f * 18;
            const s = Math.floor(total);
            const fr24 = Math.floor((total - s) * 24);
            if (tcRef.current) tcRef.current.textContent = `00:00:${String(s).padStart(2, "0")}:${String(fr24).padStart(2, "0")}`;
          },
        },
      });

      tl.to("[data-os-intro]", { autoAlpha: 0, y: -30, duration: 0.08 }, 0.06)
        /* ACT I — vector zoom through the letter counter. GPU-composited CSS
           scale on the wrapper divs (transform-origin set per composition). */
        .to("[data-os-zoom-l]", { scale: 2.2, ease: "power1.in", duration: 0.14, force3D: true }, 0)
        .to("[data-os-zoom-p]", { scale: 2.2, ease: "power1.in", duration: 0.14, force3D: true }, 0)
        .to("[data-os-zoom-l]", { scale: 26, ease: "power2.in", duration: 0.12, force3D: true }, 0.14)
        .to("[data-os-zoom-p]", { scale: 26, ease: "power2.in", duration: 0.12, force3D: true }, 0.14)
        .to("[data-os-type]", { autoAlpha: 0, duration: 0.07 }, 0.19)
        /* ACT II — the one-take */
        .to("[data-os-film]", { autoAlpha: 1, duration: 0.06 }, 0.25)
        .to("[data-os-film]", { autoAlpha: 0, scale: 0.94, duration: 0.07 }, 0.71)
        /* ACT III — blinds, then live data */
        .to(slats, { yPercent: 0, duration: 0.15 }, 0.73)
        .to("[data-os-live]", { autoAlpha: 1, y: 0, duration: 0.1 }, 0.87);
    }, ref);
    return () => ctx.revert();
  }, [heroFilm.length]);

  const cityDeps = (departures[city.slug] ?? []).slice(0, 3);
  const cityPrices = fromPrices[city.slug] ?? {};

  return (
    <section ref={ref} className="relative h-[300vh] bg-ink sm:h-[380vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* footage living inside the letters */}
        <div className="absolute inset-0 z-10">
          <SiteMedia
            src={heroBg}
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-[maisonDrift_14s_ease-in-out_infinite_alternate] object-cover"
          />
          <div className="absolute inset-0 bg-ink/10" aria-hidden="true" />
        </div>

        {/* ACT I chrome */}
        <div data-os-intro className="absolute inset-x-0 top-[12%] z-30 px-4 text-center">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.4em] text-gold sm:text-[0.62rem] sm:tracking-[0.5em]">
            {eyebrow}
          </p>
        </div>

        {/* the slab. The zoom scales each wrapper DIV (a GPU-composited CSS
            transform) rather than the SVG <g> — the mask rasterizes once and the
            compositor scales that layer, so the fly-through stays smooth on
            mobile instead of re-rasterizing the mask every frame. */}
        <div data-os-type className="absolute inset-0 z-20">
          {/* landscape composition */}
          <div data-os-zoom-l className="hidden h-full w-full will-change-transform [backface-visibility:hidden] sm:block" style={{ transformOrigin: "51.2% 44.8%" }}>
            <svg className="h-full w-full" viewBox="0 0 1000 563" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <mask id="os-cut-l">
                  <rect x="-3000" y="-3000" width="7000" height="7000" fill="white" />
                  <text x="500" y="255" textAnchor="middle" dominantBaseline="central" fill="black" fontSize="196" fontWeight="800" letterSpacing="-6" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    {markWord}
                  </text>
                  <text x="500" y="420" textAnchor="middle" dominantBaseline="central" fill="black" fontSize="60" fontWeight="800" letterSpacing="18" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    {markSub}
                  </text>
                </mask>
              </defs>
              <rect x="-3000" y="-3000" width="7000" height="7000" fill="#16130f" mask="url(#os-cut-l)" />
              <line x1="330" y1="330" x2="670" y2="330" stroke="#f5a31a" strokeWidth="1.5" strokeOpacity="0.7" />
            </svg>
          </div>
          {/* portrait composition */}
          <div data-os-zoom-p className="h-full w-full will-change-transform [backface-visibility:hidden] sm:hidden" style={{ transformOrigin: "52.6% 42.8%" }}>
            <svg className="h-full w-full" viewBox="0 0 563 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <mask id="os-cut-p">
                  <rect x="-3000" y="-3000" width="7000" height="7000" fill="white" />
                  <text x="281" y="430" textAnchor="middle" dominantBaseline="central" fill="black" fontSize="116" fontWeight="800" letterSpacing="-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    {markWord}
                  </text>
                  <text x="281" y="530" textAnchor="middle" dominantBaseline="central" fill="black" fontSize="38" fontWeight="800" letterSpacing="10" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    {markSub}
                  </text>
                </mask>
              </defs>
              <rect x="-3000" y="-3000" width="7000" height="7000" fill="#16130f" mask="url(#os-cut-p)" />
              <line x1="150" y1="478" x2="413" y2="478" stroke="#f5a31a" strokeWidth="1.2" strokeOpacity="0.7" />
            </svg>
          </div>
        </div>
        <p className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-[0.56rem] font-bold uppercase tracking-[0.35em] text-white/50 sm:text-[0.6rem]">
          {scrollCue}
        </p>

        {/* ACT II — the one-take */}
        <div data-os-film className="absolute inset-0 z-40 flex items-center justify-center bg-black opacity-0">
          <div className="relative aspect-video w-full max-w-6xl overflow-hidden bg-black">
            {film.map((f, i) => (
              <div key={`${f.src}-${i}`} data-os-frame className="absolute inset-0 opacity-0 will-change-transform">
                <SiteMedia src={f.src} alt="" fill sizes="90vw" className="object-cover" />
              </div>
            ))}
            <div className="noise absolute inset-0" aria-hidden="true" />
            <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_130px_rgba(0,0,0,0.75)]" />
            <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-5 sm:top-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
              <p className="font-mono text-[0.52rem] tracking-[0.2em] text-white/70 sm:text-[0.62rem] sm:tracking-[0.25em]">ONE TAKE — YOUR NEXT WEEK</p>
            </div>
            <p ref={tcRef} className="absolute right-3 top-3 font-mono text-[0.56rem] tracking-[0.12em] text-gold tabular-nums sm:right-5 sm:top-4 sm:text-[0.66rem]">00:00:00:00</p>
            {film.map((f, i) => (
              <div key={i} data-os-meta className="absolute bottom-3 left-3 opacity-0 sm:bottom-4 sm:left-5" style={{ transition: "opacity .3s" }}>
                <p className="font-mono text-[0.6rem] font-bold tracking-[0.16em] text-white sm:text-[0.7rem] sm:tracking-[0.2em]">{f.place}</p>
                <p className="mt-0.5 hidden font-mono text-[0.56rem] tracking-[0.18em] text-white/50 sm:block">{f.lens}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACT III — blinds + live departures.
            Each slat shows one seventh of the same photo. This used to be a CSS
            background-image, which meant the browser fetched the ORIGINAL file
            (1.5 MB here) seven times over — CSS backgrounds can't go through
            the image optimizer. Rendering a real element that is 700% wide and
            offset per slat gives the identical composition from a single
            optimized AVIF/WebP download. */}
        <div className="absolute inset-0 z-50 flex" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="relative h-full overflow-hidden" style={{ width: `${100 / 7}%` }}>
              <div data-os-slat className="absolute inset-0" style={{ transform: `translateY(${i % 2 === 0 ? 104 : -104}%)` }}>
                <div className="absolute inset-0 overflow-hidden">
                  <SiteMedia
                    src={heroBlinds}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                    style={{ width: "700%", maxWidth: "none", left: `${-i * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div data-os-live className="absolute inset-0 z-[60] flex flex-col items-center justify-center px-4 opacity-0 sm:px-5">
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[1.6rem] border border-white/15 bg-ink/60 p-5 text-center backdrop-blur-xl sm:rounded-[1.8rem] sm:p-9">
            <div className="flex items-center justify-center">
              <CitySwitcher tone="dark" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.02] tracking-tight text-white sm:mt-5 sm:text-6xl">
              {headline}
              <br />
              <span className="text-gold">{headlineAccent}</span>
            </h1>
            {cityDeps.length > 0 ? (
              <div className="mt-5 space-y-2 text-left sm:mt-6">
                {cityDeps.map((d) => (
                  <Link
                    key={d.slug + d.date}
                    href={`/trips/${d.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 transition-colors hover:border-gold sm:px-5 sm:py-3.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm font-extrabold text-white sm:text-base">{d.name}</span>
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/50 sm:text-[0.66rem]">
                        {weekday(d.date)} · {shortDate(d.date)} · ex-{city.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-base font-extrabold text-gold sm:text-lg">
                      {cityPrices[d.slug] ? `${inr(cityPrices[d.slug])}` : "→"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-white/60">New batches from {city.name} drop weekly — talk to us.</p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6 sm:gap-4">
              <Link href="/trips" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-red transition-colors hover:bg-brand-bright sm:min-h-12 sm:px-8 sm:py-4 sm:text-base">
                All departures →
              </Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold sm:min-h-12 sm:px-7 sm:py-4 sm:text-base">
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
