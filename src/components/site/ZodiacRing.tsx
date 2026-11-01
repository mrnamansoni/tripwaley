"use client";

/* THE ZODIAC — lab L13 wired to the real regions.
   Regions orbit a ring of circular type; each photo counter-rotates to stay
   upright. Hover/focus holds the sky. The centre disc is a real wheel: tap it
   and the ring whirls, decelerates and parks one region under the needle,
   then offers a link to that region below.

   One rotation value drives everything (ring, type, counter-rotation) from
   the GSAP ticker, so the idle drift and the spin hand off without a jump —
   CSS keyframes can't be read mid-flight to start a spin from. */

import { useEffect, useRef, useState } from "react";
import SiteMedia from "./SiteMedia";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

export interface ZodiacItem {
  img: string;
  label: string;
  href: string; // in-page anchor to the region section
}

/** idle drift — one turn every 30s, as the CSS version did */
const DRIFT_DEG_PER_S = 12;

/* paint one angle onto the ring, the type and every upright photo */
function paintOrbit(root: HTMLElement | null, deg: number) {
  if (!root) return;
  root.querySelectorAll<HTMLElement>("[data-zr-turn]").forEach((el) => (el.style.transform = `rotate(${deg}deg)`));
  root.querySelectorAll<HTMLElement>("[data-zr-upright]").forEach((el) => (el.style.transform = `rotate(${-deg}deg)`));
}

export default function ZodiacRing({
  items,
  headline = "Wherever it stops,",
  accent = "you win.",
  sub = "Every region in constant orbit.",
  ringText = "TRIPWALEY · 14 STATES · 350 DEPARTURES · ONE CREW ·",
}: {
  items: ZodiacItem[];
  headline?: string;
  accent?: string;
  sub?: string;
  ringText?: string;
}) {
  const [held, setHeld] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ deg: 0 });
  const heldRef = useRef(false);
  const spinRef = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    heldRef.current = held !== null;
  }, [held]);

  const paint = () => paintOrbit(orbitRef.current, rot.current.deg);

  useEffect(() => {
    const root = orbitRef.current;
    if (!root || prefersReducedMotion()) return;
    let onScreen = false;
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
    io.observe(root);
    const spinState = spinRef;
    const drift = (_t: number, dtMs: number) => {
      if (!onScreen || heldRef.current || spinState.current) return;
      rot.current.deg += (DRIFT_DEG_PER_S * Math.min(dtMs, 64)) / 1000;
      paintOrbit(root, rot.current.deg);
    };
    gsap.ticker.add(drift);
    return () => {
      gsap.ticker.remove(drift);
      io.disconnect();
      spinState.current?.kill();
    };
  }, []);

  const spin = () => {
    if (spinRef.current || items.length === 0) return;
    const pick = Math.floor(Math.random() * items.length);
    const base = (pick / items.length) * 360;
    const now = rot.current.deg;
    /* item angle on screen = base + rotation; the needle points straight up
       (-90°). Add 4–5 full turns so it reads as a real spin. */
    const toTop = (((-90 - base - now) % 360) + 360) % 360;
    const target = now + 360 * (4 + Math.round(Math.random())) + toTop;
    setWinner(null);
    setHeld(null);

    if (prefersReducedMotion()) {
      rot.current.deg = target;
      paint();
      setWinner(pick);
      return;
    }
    setSpinning(true);
    spinRef.current = gsap.to(rot.current, {
      deg: target,
      duration: 4.2,
      ease: "power4.out",
      onUpdate: paint,
      onComplete: () => {
        spinRef.current = null;
        setSpinning(false);
        setWinner(pick);
      },
    });
  };

  if (items.length < 3) return null;
  const won = winner !== null ? items[winner] : null;

  return (
    <section id="wheel" className="scroll-mt-24 overflow-hidden bg-cream py-[10vh]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the wheel of wander</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            {headline}
            <br />
            <span className="text-brand">{accent}</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/65">{sub}</p>
          <div className="mt-6 flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
            {won ? (
              <>
                <p className="font-script text-2xl text-brand">{won.label}. good choice.</p>
                <a
                  href={won.href}
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-cream transition-colors hover:bg-brand"
                >
                  Show me {won.label} →
                </a>
                <button type="button" onClick={spin} className="min-h-11 text-sm font-bold text-ink/65 underline-offset-4 hover:text-brand hover:underline">
                  spin again
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={spin}
                disabled={spinning}
                className="min-h-11 font-script text-2xl text-brand transition-opacity disabled:opacity-60"
              >
                {spinning ? "round and round…" : held ? `${held}. good choice.` : "spin the wheel →"}
              </button>
            )}
          </div>
        </div>

        {/* the orbit */}
        <div ref={orbitRef} className="relative mx-auto aspect-square w-full max-w-[34rem]">
          <svg data-zr-turn viewBox="0 0 200 200" className="absolute inset-[19%]" aria-hidden="true">
            <defs>
              <path id="zr-circ" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
            </defs>
            <text fill="#c9252c" fontSize="13.5" fontWeight="700" letterSpacing="3.5" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              <textPath href="#zr-circ">{ringText}</textPath>
            </text>
          </svg>

          <div data-zr-turn className="absolute inset-0">
            {items.map((it, i) => {
              const ang = (i / items.length) * Math.PI * 2;
              const x = 50 + 46 * Math.cos(ang);
              const y = 50 + 46 * Math.sin(ang);
              const isWin = winner === i;
              return (
                <div key={it.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                  <div data-zr-upright>
                    <a
                      href={it.href}
                      aria-label={`Jump to ${it.label}`}
                      onMouseEnter={() => setHeld(it.label)}
                      onMouseLeave={() => setHeld(null)}
                      onFocus={() => setHeld(it.label)}
                      onBlur={() => setHeld(null)}
                      className={`relative block h-20 w-20 overflow-hidden rounded-full border-[3px] shadow-card-lg outline-offset-4 transition-transform duration-300 hover:scale-125 sm:h-24 sm:w-24 ${
                        isWin ? "scale-125 border-brand" : "border-cream"
                      }`}
                    >
                      <SiteMedia src={it.img} alt={it.label} fill sizes="96px" className="object-cover" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* the needle + the spin button */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30%] w-0 -translate-x-1/2 -translate-y-full" aria-hidden="true">
            <span className="absolute -left-[1.5px] bottom-0 top-3 w-[3px] rounded-full bg-ink/80" />
            <span className="absolute -left-[7px] top-0 h-0 w-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-ink/80" />
          </div>
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            aria-label="Spin the wheel"
            className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand shadow-red transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-progress"
          >
            <span className="font-script text-2xl text-white">{spinning ? "…" : "go"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
