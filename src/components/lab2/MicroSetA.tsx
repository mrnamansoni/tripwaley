"use client";

/* L41–L45 — micro-interaction set A
   The small parts that make a site feel hand-built: a living cursor,
   a page-transition wipe, split-flap headings, odometer stats, and a
   plane that flies your reading progress. */

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

/* ============ L41 — "The Companion" · custom cursor system ============ */

export function L41CursorSystem() {
  const ref = useEntrance<HTMLElement>();
  const zoneRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const ring = ringRef.current;
    if (!zone || !ring) return;
    const dx = gsap.quickTo(dotRef.current, "x", { duration: 0.08 });
    const dy = gsap.quickTo(dotRef.current, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      dx(x); dy(y); rx(x); ry(y);
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cur]");
      const mode = target?.dataset.cur ?? "";
      if (labelRef.current) labelRef.current.textContent = mode;
      gsap.to(ring, { scale: mode ? 2.6 : 1, backgroundColor: mode ? "rgba(201,37,44,0.92)" : "rgba(201,37,44,0)", duration: 0.3 });
    };
    zone.addEventListener("pointermove", onMove, { passive: true });
    return () => zone.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow>L41 · the companion cursor</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          A cursor that <span className="text-brand">talks back.</span>
        </h3>
        <div
          ref={zoneRef}
          data-in
          className="relative mt-8 grid gap-4 overflow-hidden rounded-3xl border border-line bg-blush p-8 sm:grid-cols-3 sm:p-12 [&_*]:cursor-none"
          style={{ cursor: "none" }}
        >
          {[
            { cur: "view", label: "Hover me", sub: "gallery tiles say view" },
            { cur: "drag", label: "Hover me too", sub: "carousels say drag" },
            { cur: "book →", label: "And me", sub: "CTAs say book" },
          ].map((c) => (
            <div key={c.cur} data-cur={c.cur} className="flex h-40 flex-col items-center justify-center rounded-2xl border border-line bg-card text-center shadow-sm">
              <p className="font-display text-xl font-extrabold text-ink">{c.label}</p>
              <p className="mt-1 text-xs text-ink/50">{c.sub}</p>
            </div>
          ))}
          {/* the companion */}
          <div ref={dotRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
          <div ref={ringRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand">
            <span ref={labelRef} className="text-[0.5rem] font-extrabold uppercase tracking-wider text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ L42 — "The Shutter" · page transition wipe ============ */

export function L42PageWipe() {
  const ref = useEntrance<HTMLElement>();
  const slabRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLParagraphElement>(null);
  const [dest, setDest] = useState("Ladakh");
  const busy = useRef(false);

  const fire = useCallback((to: string) => {
    if (busy.current) return;
    busy.current = true;
    const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
    tl.set(slabRef.current, { yPercent: 100 })
      .to(slabRef.current, { yPercent: 0, duration: 0.5, ease: "power4.inOut" })
      .fromTo(markRef.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" })
      .add(() => setDest(to), "+=0.1")
      .to(markRef.current, { autoAlpha: 0, y: -24, duration: 0.3, ease: "power3.in" }, "+=0.35")
      .to(slabRef.current, { yPercent: -100, duration: 0.5, ease: "power4.inOut" });
  }, []);

  return (
    <section ref={ref} className="bg-ink py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow tone="gold">L42 · the shutter wipe</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Between pages, <span className="text-gold">a breath.</span>
        </h3>
        <div data-in className="relative mt-8 flex h-72 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#191821]">
          <p className="font-display text-4xl font-extrabold text-white sm:text-6xl">{dest}</p>
          <p className="mt-2 text-sm text-white/45">current page · tap a route to travel</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["Kashmir", "Kerala", "Spiti", "Andaman"].map((d) => (
              <button key={d} type="button" onClick={() => fire(d)} className="min-h-11 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 transition-colors hover:border-gold hover:text-gold">
                {d} →
              </button>
            ))}
          </div>
          {/* the slab */}
          <div ref={slabRef} className="absolute inset-0 flex items-center justify-center bg-brand" style={{ transform: "translateY(100%)" }}>
            <p ref={markRef} className="font-script text-4xl text-white opacity-0">tripwaley</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ L43 — "Departure Board Type" · split-flap headings ============ */

const FLAP_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";

export function L43SplitFlapText() {
  const ref = useEntrance<HTMLElement>();
  const [phrase, setPhrase] = useState("KASHMIR CALLING");
  const [display, setDisplay] = useState<string[]>(phrase.split(""));
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const scramble = useCallback((next: string) => {
    timers.current.forEach(clearInterval);
    timers.current = [];
    const target = next.padEnd(Math.max(next.length, 1), " ").split("");
    setPhrase(next);
    setDisplay((prev) => {
      const seed = target.map((_, i) => prev[i] ?? " ");
      return seed;
    });
    target.forEach((ch, i) => {
      let steps = 0;
      const iv = setInterval(() => {
        steps++;
        setDisplay((d) => {
          const copy = [...d];
          copy[i] = steps > 6 + i ? ch : FLAP_GLYPHS[Math.floor(Math.random() * FLAP_GLYPHS.length)];
          return copy;
        });
        if (steps > 6 + i) clearInterval(iv);
      }, 42);
      timers.current.push(iv);
    });
  }, []);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  return (
    <section ref={ref} className="bg-[#121110] py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow tone="gold">L43 · departure-board type</Eyebrow>
        <h3 data-in className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Headlines that <span className="text-gold">re-file themselves.</span>
        </h3>
        <div data-in className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-8 sm:p-12">
          <p className="flex flex-wrap gap-1 font-mono text-3xl font-bold tracking-tight text-gold sm:text-5xl" aria-label={phrase}>
            {display.map((ch, i) => (
              <span key={i} className={`inline-block min-w-[0.72em] rounded bg-[#181614] px-1 text-center shadow-[inset_0_-2px_4px_rgba(0,0,0,0.7)] ${ch === " " ? "bg-transparent shadow-none" : ""}`} aria-hidden="true">
                {ch}
              </span>
            ))}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {["KASHMIR CALLING", "SPITI IS OPEN", "MONSOON READY", "SEATS LEFT THREE"].map((p) => (
              <button key={p} type="button" onClick={() => scramble(p)} className="min-h-10 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 transition-colors hover:border-gold hover:text-gold">
                {p.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ L44 — "The Odometer" · rolling stat counters ============ */

const STATS = [
  { end: 350, suffix: "+", label: "departures a year" },
  { end: 12000, suffix: "+", label: "wanderers carried" },
  { end: 14, suffix: "", label: "states covered" },
  { end: 49, suffix: "", label: "rating ×10", decimal: true },
];

export function L44Odometer() {
  const ref = useEntrance<HTMLElement>();

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-l44-num]");
    const ctx = gsap.context(() => {
      els.forEach((el) => {
        const end = Number(el.dataset.end);
        const dec = el.dataset.decimal === "1";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end, duration: 2.2, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
          onUpdate: () => {
            el.textContent = dec ? (obj.v / 10).toFixed(1) : Math.round(obj.v).toLocaleString("en-IN");
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-brand py-[9vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow tone="light">L44 · the odometer band</Eyebrow>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} data-in className="text-center sm:text-left">
              <p className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                <span data-l44-num data-end={s.end} data-decimal={s.decimal ? "1" : "0"}>0</span>
                <span className="text-gold">{s.suffix}</span>
              </p>
              <p className="mt-1 text-[0.66rem] font-bold uppercase tracking-[0.25em] text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ L45 — "Progress, Airborne" · plane on a path ============ */

export function L45ProgressPlane() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top 65%", end: "bottom 60%", scrub: 0.4,
          onUpdate: (self) => {
            const p = self.progress;
            path.style.strokeDashoffset = String(len * (1 - p));
            const pt = path.getPointAtLength(len * p);
            const ahead = path.getPointAtLength(Math.min(len, len * p + 2));
            const deg = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
            planeRef.current?.setAttribute("transform", `translate(${pt.x},${pt.y}) rotate(${deg})`);
            if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100));
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-blush py-[10vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Eyebrow>L45 · reading progress, airborne</Eyebrow>
        <h3 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          This section is <span className="text-brand"><span ref={pctRef}>0</span>% flown.</span>
        </h3>
        <div className="mt-8 rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-10">
          <svg viewBox="0 0 800 150" className="w-full" aria-hidden="true">
            <path d="M 30 120 C 180 30, 380 140, 520 60 S 740 40, 775 95" fill="none" stroke="rgba(22,19,15,0.12)" strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" />
            <path ref={pathRef} d="M 30 120 C 180 30, 380 140, 520 60 S 740 40, 775 95" fill="none" stroke="#c9252c" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="120" r="5" fill="#16130f" />
            <circle cx="775" cy="95" r="5" fill="#f5a31a" />
            <g ref={planeRef}>
              <path d="M10,0 L-6,-6 L-2,0 L-6,6 Z" fill="#c9252c" stroke="#faf6ef" strokeWidth="1.2" />
            </g>
          </svg>
          <p className="mt-4 text-center text-sm text-ink/55">
            Wire this to whole-page scroll and your progress bar becomes a boarding pass. Scroll up — the plane flies home.
          </p>
        </div>
      </div>
    </section>
  );
}
