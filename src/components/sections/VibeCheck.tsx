"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import RouteDraw from "@/components/svg/RouteDraw";
import { testimonials, vibes } from "@/lib/data";
import { useBooking } from "@/components/booking/BookingContext";

const MAX_PICKS = 3;

/** Deterministic "tribe match" score from the selected vibes (demo logic —
 *  swap for the real matching API when it exists). */
function scoreFor(picked: string[]): number {
  const sum = vibes
    .filter((v) => picked.includes(v.id))
    .reduce((acc, v) => acc + v.weight, 0);
  return 84 + ((sum * 7) % 13); // always lands 84–96
}

export default function VibeCheck() {
  const { waLink } = useBooking();
  const [picked, setPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < MAX_PICKS
          ? [...prev, id]
          : prev
    );

  /* Animate the result panel in: score counts up, bars grow (transform only) */
  useEffect(() => {
    if (!revealed || !resultRef.current) return;
    const target = scoreFor(picked);
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.fromTo(
        resultRef.current,
        { autoAlpha: 0, y: 24, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }
      );
      gsap.to(counter, {
        v: target,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = String(Math.round(counter.v));
        },
      });
      gsap.fromTo(
        "[data-vibe-bar]",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.25 }
      );
      gsap.fromTo(
        "[data-vibe-avatar]",
        { scale: 0 },
        { scale: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.07, delay: 0.15 }
      );
    }, resultRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const batch = testimonials.slice(0, 6);

  return (
    <section id="vibe-check" className="relative overflow-hidden bg-blush pb-24 pt-10 sm:pb-32">
      {/* route connecting collections → vibe check */}
      <RouteDraw
        d="M100 20 C 300 120, 200 200, 420 240 S 760 200, 900 320"
        viewBox="0 0 1000 360"
        className="pointer-events-none absolute -left-10 top-0 hidden w-[52rem] opacity-70 xl:block"
        markers={[{ x: 420, y: 240 }]}
        start="top 85%"
        end="top 30%"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {/* ------------------------------------------------------ left: pitch */}
        <div>
          <p className="font-script text-2xl text-brand sm:text-3xl">the tripwaley difference</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Who you travel with <span className="text-brand">&gt;</span> where you go.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/65 sm:text-lg">
            Every Tripwaley batch is vibe-curated — 22 to 35 year olds, 60% solo
            travellers, screened for good energy. Tell us your travel personality and
            we&apos;ll show you the batch you&apos;d actually want at your bonfire.
          </p>
          <ul className="mt-7 space-y-3.5">
            {[
              ["🧭", "One certified trip captain per 15 travellers"],
              ["🛡️", "Women-safe verified stays & transport on every route"],
              ["💬", "Batch WhatsApp group live 2 weeks before departure"],
            ].map(([emoji, text]) => (
              <li key={text} className="flex items-start gap-3 text-[0.95rem] font-medium text-ink/80">
                <span className="mt-0.5 text-lg" aria-hidden="true">{emoji}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------- right: the check */}
        <div className="relative rounded-3xl border border-line bg-card p-6 shadow-card-lg sm:p-8">
          <div className="absolute -right-3 -top-3 rotate-6 rounded-full bg-gold px-4 py-2 font-script text-lg font-bold text-ink shadow-card" aria-hidden="true">
            30 sec ✦
          </div>

          {!revealed ? (
            <>
              <h3 className="font-display text-2xl font-extrabold">Co-traveller vibe check</h3>
              <p className="mt-1.5 text-sm text-ink/60">
                Pick up to {MAX_PICKS} — we&apos;ll match you with a batch. ({picked.length}/{MAX_PICKS})
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Pick your travel vibes">
                {vibes.map((v) => {
                  const on = picked.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(v.id)}
                      aria-pressed={on}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                        on
                          ? "border-brand bg-brand text-white shadow-red"
                          : "border-line bg-cream text-ink/75 hover:border-brand/50 hover:text-ink"
                      }`}
                    >
                      <span aria-hidden="true">{v.emoji}</span>
                      {v.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setRevealed(true)}
                disabled={picked.length === 0}
                className="mt-7 w-full rounded-full bg-ink px-6 py-4 text-base font-bold text-cream transition-all hover:bg-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {picked.length === 0 ? "Pick a vibe to continue" : "Reveal my tribe →"}
              </button>
            </>
          ) : (
            <div ref={resultRef}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-extrabold">Your tribe match</h3>
                <p className="font-display text-4xl font-extrabold text-brand">
                  <span ref={scoreRef}>0</span>%
                </p>
              </div>

              {/* avatar cluster of a real-feeling batch */}
              <div className="mt-5 flex items-center">
                {batch.map((t) => (
                  <span
                    key={t.name}
                    data-vibe-avatar
                    className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-card text-sm font-bold text-white first:ml-0"
                    style={{ background: `linear-gradient(135deg, hsl(${t.hue} 65% 52%), hsl(${t.hue + 40} 70% 42%))` }}
                    aria-hidden="true"
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                ))}
                <span data-vibe-avatar className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-card bg-blush text-xs font-bold text-brand">
                  +12
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/60">
                Your August batch so far — 18 travellers, avg age 26.
              </p>

              {/* batch composition bars */}
              <div className="mt-5 space-y-3.5">
                {[
                  ["Solo travellers", 62],
                  ["Women in batch", 58],
                  ["Share your vibes", scoreFor(picked) - 14],
                ].map(([label, pct]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs font-bold text-ink/70">
                      <span>{label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blush">
                      <div
                        data-vibe-bar
                        className="h-full origin-left rounded-full bg-gradient-to-r from-brand to-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={waLink(`Hi Tripwaley! My vibe check said ${scoreFor(picked)}% match — tell me about the August batches! 🔥`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 block w-full rounded-full bg-brand px-6 py-4 text-center text-base font-bold text-white shadow-red transition-colors hover:bg-brand-bright"
              >
                Meet your batch on WhatsApp
              </a>
              <button
                onClick={() => {
                  setRevealed(false);
                  setPicked([]);
                }}
                className="mt-3 w-full text-center text-sm font-semibold text-ink/50 underline decoration-2 underline-offset-4 transition-colors hover:text-brand"
              >
                Retake the check
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
