"use client";

/* L46–L50 — micro-interaction set B
   Weather that animates itself, a price slider with personality, an FAQ
   with manners, a preloader worth the wait, and a language pill that
   morphs open like glass. */

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

/* ============ L46 — "The Forecast" · living weather cards ============ */

export function L46WeatherCards() {
  const ref = useEntrance<HTMLElement>();

  return (
    <section ref={ref} className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow>L46 · the forecast strip</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Weather, <span className="text-brand">doing its job.</span>
        </h3>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {/* SUN — Jaipur */}
          <div data-in className="relative overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#f7b733,#e8935a)] p-7 text-white shadow-card-lg">
            <div aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28">
              <div className="absolute inset-4 rounded-full bg-[#fff3d6]" />
              <div className="absolute inset-0 animate-[l13spin_14s_linear_infinite]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="absolute left-1/2 top-1/2 h-9 w-1 -translate-x-1/2 origin-top rounded bg-[#fff3d6]/80" style={{ transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateY(28px)` }} />
                ))}
              </div>
            </div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/80">Jaipur · now</p>
            <p className="mt-4 font-display text-6xl font-extrabold">34°</p>
            <p className="mt-1 text-sm font-semibold text-white/85">Fort-walking weather. Carry water, drama optional.</p>
          </div>
          {/* RAIN — Kochi */}
          <div data-in className="relative overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#39536b,#1f2f40)] p-7 text-white shadow-card-lg">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: "repeating-linear-gradient(105deg, transparent 0 16px, rgba(190,220,255,0.5) 16px 17px, transparent 17px 34px)",
                backgroundSize: "200% 200%",
                animation: "l46rain 0.7s linear infinite",
              }}
            />
            <p className="relative text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/80">Kochi · now</p>
            <p className="relative mt-4 font-display text-6xl font-extrabold">27°</p>
            <p className="relative mt-1 text-sm font-semibold text-white/85">Proper monsoon. Chai consumption: heroic.</p>
          </div>
          {/* SNOW — Leh */}
          <div data-in className="relative overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#8fa8c9,#4a5d7d)] p-7 text-white shadow-card-lg">
            <div aria-hidden="true" className="absolute inset-0">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-white/85"
                  style={{ left: `${(i * 37) % 100}%`, animation: `l46snow ${3 + (i % 4)}s linear ${(i % 5) * 0.7}s infinite` }}
                />
              ))}
            </div>
            <p className="relative text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/80">Leh · now</p>
            <p className="relative mt-4 font-display text-6xl font-extrabold">−2°</p>
            <p className="relative mt-1 text-sm font-semibold text-white/85">Layer up. The passes are showing off again.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ L47 — "The Dial" · budget slider with personality ============ */

const MOODS: { max: number; label: string; sub: string }[] = [
  { max: 12000, label: "Shoestring", sub: "dorms, dal, dawn buses — the classics" },
  { max: 20000, label: "Comfortable", sub: "double sharing, café mornings" },
  { max: 30000, label: "Cushy", sub: "camps with heaters, window seats" },
  { max: 50001, label: "Royal", sub: "houseboats, palaces, zero regrets" },
];

export function L47PriceSlider() {
  const ref = useEntrance<HTMLElement>();
  const [val, setVal] = useState(20000);
  const mood = MOODS.find((m) => val < m.max) ?? MOODS[MOODS.length - 1];
  const pct = ((val - 5000) / 45000) * 100;

  return (
    <section ref={ref} className="bg-blush py-[10vh]">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Eyebrow>L47 · the budget dial</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Slide until it <span className="text-brand">feels right.</span>
        </h3>

        <div data-in className="mt-9 rounded-3xl border border-line bg-card p-7 shadow-card-lg sm:p-10">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-4xl font-extrabold text-brand sm:text-5xl">₹{val.toLocaleString("en-IN")}</p>
            <p key={mood.label} className="animate-[fadeUp_.3s_ease-out] rounded-full bg-gold/15 px-4 py-1.5 font-display text-sm font-extrabold uppercase tracking-wider text-gold">
              {mood.label}
            </p>
          </div>
          <div className="relative mt-7">
            {/* filled track */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#f5a31a,#c9252c)]" style={{ width: `${pct}%` }} />
            </div>
            {/* ticks */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`h-4 w-px ${(i / 9) * 100 < pct ? "bg-white/60" : "bg-ink/20"}`} />
              ))}
            </div>
            <input
              type="range" min={5000} max={50000} step={500} value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              aria-label="Trip budget"
              className="relative z-10 h-10 w-full cursor-ew-resize appearance-none bg-transparent
                [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-cream [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-red
                [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-cream [&::-moz-range-thumb]:bg-brand"
            />
          </div>
          <p className="mt-3 text-sm text-ink/60">{mood.sub}</p>
          <button type="button" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-7 py-3.5 font-bold text-cream transition-colors hover:bg-brand">
            Show {mood.label.toLowerCase()} trips →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============ L48 — "Asked & Answered" · FAQ with manners ============ */

const FAQS = [
  { q: "I'm coming solo. Is that weird?", a: "72% of every batch is solo travellers. By day two, 'solo' stops being a category. By day six you have a group chat you'll never leave." },
  { q: "How fit do I need to be?", a: "If you can climb four floors of stairs while complaining, you can do our easy and moderate treks. Hard ones get an honest difficulty tag and a prep plan." },
  { q: "What if I need to cancel?", a: "Full refund until 15 days out, 50% until 7. Or shift your seat to any future batch for free — the mountains reschedule better than most people." },
  { q: "Is it safe for women?", a: "Women-only dorm options, women captains on request, verified stays, live location sharing for family. 41% of our travellers are women, and they come back." },
];

export function L48Faq() {
  const ref = useEntrance<HTMLElement>();
  const [open, setOpen] = useState(0);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = useCallback((i: number) => {
    setOpen((cur) => {
      const next = cur === i ? -1 : i;
      bodies.current.forEach((el, j) => {
        if (!el) return;
        gsap.to(el, { height: j === next ? "auto" : 0, duration: 0.55, ease: "power3.inOut" });
      });
      return next;
    });
  }, []);

  useEffect(() => {
    bodies.current.forEach((el, j) => el && gsap.set(el, { height: j === 0 ? "auto" : 0 }));
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Eyebrow>L48 · asked &amp; answered</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          The 2 AM <span className="text-brand">questions.</span>
        </h3>
        <div data-in className="mt-8 divide-y divide-line rounded-3xl border border-line bg-card shadow-sm">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => toggle(i)} aria-expanded={open === i} className="flex w-full items-center gap-4 px-6 py-5 text-left sm:px-8">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-500 ${open === i ? "rotate-45 border-brand bg-brand text-white" : "border-ink/25 text-ink/50"}`} aria-hidden="true">
                  +
                </span>
                <span className={`font-display text-lg font-extrabold transition-colors sm:text-xl ${open === i ? "text-brand" : "text-ink"}`}>{f.q}</span>
              </button>
              <div ref={(el) => { bodies.current[i] = el; }} className="overflow-hidden" style={{ height: 0 }}>
                <p className="px-6 pb-6 pl-[4.5rem] text-[0.95rem] leading-relaxed text-ink/65 sm:px-8 sm:pl-20">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ L49 — "The Warm-Up" · preloader worth the wait ============ */

export function L49Preloader() {
  const ref = useEntrance<HTMLElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGTextElement>(null);
  const numRef = useRef<HTMLParagraphElement>(null);
  const busy = useRef(false);

  const replay = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const stage = stageRef.current;
    const logo = logoRef.current;
    if (!stage || !logo) return;
    const halves = stage.querySelectorAll<HTMLElement>("[data-l49-half]");
    const obj = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
    tl.set(halves, { yPercent: 0 })
      .set(logo, { strokeDasharray: 600, strokeDashoffset: 600, fillOpacity: 0 })
      .to(logo, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" })
      .to(obj, {
        v: 100, duration: 1.5, ease: "power3.inOut",
        onUpdate: () => { if (numRef.current) numRef.current.textContent = `${Math.round(obj.v)}%`; },
      }, 0)
      .to(logo, { fillOpacity: 1, duration: 0.4 }, "-=0.3")
      .to(halves[0], { yPercent: -101, duration: 0.7, ease: "power4.inOut" }, "+=0.25")
      .to(halves[1], { yPercent: 101, duration: 0.7, ease: "power4.inOut" }, "<");
  }, []);

  useEffect(() => {
    const t = setTimeout(replay, 600);
    return () => clearTimeout(t);
  }, [replay]);

  return (
    <section ref={ref} className="bg-ink py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="gold">L49 · the warm-up (preloader)</Eyebrow>
            <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Loading, but <span className="text-gold">make it brand.</span>
            </h3>
          </div>
          <button type="button" data-in onClick={replay} className="min-h-11 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 transition-colors hover:border-gold hover:text-gold">
            ↺ replay
          </button>
        </div>

        <div ref={stageRef} data-in className="relative mt-8 h-80 overflow-hidden rounded-3xl border border-white/10">
          {/* the page underneath */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#191821]">
            <p className="font-display text-2xl font-extrabold text-white/85 sm:text-4xl">…and the site is <span className="text-gold">ready.</span></p>
          </div>
          {/* the two curtain halves */}
          <div data-l49-half className="absolute inset-x-0 top-0 h-1/2 bg-brand will-change-transform" />
          <div data-l49-half className="absolute inset-x-0 bottom-0 h-1/2 bg-brand will-change-transform" />
          {/* logo + counter above the curtain */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <svg viewBox="0 0 260 80" className="h-20">
              <text
                ref={logoRef}
                x="130" y="56" textAnchor="middle"
                fontSize="56" fontWeight="400"
                fill="#fff" stroke="#fff" strokeWidth="1.4"
                style={{ fontFamily: "var(--font-script), cursive" }}
              >
                tripwaley
              </text>
            </svg>
            <p ref={numRef} className="mt-1 font-mono text-sm text-white/70 tabular-nums">0%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ L50 — "The Concierge Pill" · language & currency morph ============ */

const LANGS = [
  { code: "EN", name: "English" }, { code: "हि", name: "हिन्दी" },
  { code: "த", name: "தமிழ்" }, { code: "বা", name: "বাংলা" },
];
const CURRENCIES = ["₹ INR", "$ USD", "€ EUR", "د.إ AED"];

export function L50LangPill() {
  const ref = useEntrance<HTMLElement>();
  const [openPanel, setOpenPanel] = useState(false);
  const [lang, setLang] = useState("EN");
  const [cur, setCur] = useState("₹ INR");

  return (
    <section ref={ref} className="bg-blush py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow>L50 · the concierge pill</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Speaks your <span className="text-brand">language.</span>
        </h3>

        <div data-in className="mt-8 flex min-h-[22rem] items-start justify-center rounded-3xl border border-line bg-[linear-gradient(160deg,#2a2530,#16130f)] p-8">
          <div className={`overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.3,0.5,1)] ${openPanel ? "w-full max-w-sm" : "w-44"}`}>
            <button
              type="button"
              onClick={() => setOpenPanel((v) => !v)}
              aria-expanded={openPanel}
              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-white"
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true">🌐</span>
                <span className="text-sm font-bold">{lang} · {cur.split(" ")[0]}</span>
              </span>
              <span className={`text-xs transition-transform duration-500 ${openPanel ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
            </button>

            <div className={`grid transition-all duration-500 ${openPanel ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-white/12 p-5">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/45">language</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {LANGS.map((l) => (
                      <button key={l.code} type="button" onClick={() => setLang(l.code)} className={`flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${lang === l.code ? "bg-gold text-ink" : "bg-white/8 text-white/75 hover:bg-white/15"}`}>
                        {l.name}
                        {lang === l.code && <span aria-hidden="true">✓</span>}
                      </button>
                    ))}
                  </div>
                  <p className="mt-5 text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/45">currency</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CURRENCIES.map((c) => (
                      <button key={c} type="button" onClick={() => setCur(c)} className={`min-h-10 rounded-full px-4 py-2 text-xs font-bold transition-colors ${cur === c ? "bg-brand text-white" : "bg-white/8 text-white/75 hover:bg-white/15"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
