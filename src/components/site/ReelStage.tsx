"use client";

/* THE REEL STAGE — admin-curated reels, playing live on the homepage.
 *
 * A fanned deck of phone-shaped frames: the middle reel plays, its neighbours
 * wait either side, and the stage moves on by itself when a reel ends
 * (stories-style bars along the top show where you are). Tap a side reel,
 * swipe, or use the arrow keys to move.
 *
 * The canvas: a tiny <canvas> behind the stage repaints from the playing
 * video ten times a second, blurred out to fill the section — so the whole
 * band glows in whatever colours the reel is showing. 24×42 pixels is all
 * the blur needs, which keeps it near-free. Drawing a cross-origin video
 * only "taints" the canvas (we never read it back), so pasted links work.
 *
 * Only the middle reel ever decodes; everything pauses off-screen. Under
 * reduced motion nothing autoplays — the deck still works, and a reel plays
 * when tapped. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReelView } from "@/lib/catalog";
import { prefersReducedMotion } from "@/lib/motion";

/** reels visible either side of the middle one */
const SPAN = 2;
const AMBIENT_W = 24;
const AMBIENT_H = 42;

/** signed distance from the middle, wrapped so the deck reads as a ring */
function offsetOf(i: number, idx: number, n: number): number {
  let o = i - idx;
  if (n > 2) {
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
  }
  return o;
}

export default function ReelStage({
  reels,
  eyebrow,
  headline,
  accent,
}: {
  reels: ReelView[];
  eyebrow: string;
  headline: string;
  accent: string;
}) {
  const n = reels.length;
  const [idx, setIdx] = useState(0);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const idxRef = useRef(0);
  /** the visitor's intent: autoplay unless reduced motion, then whatever they tap */
  const wantPlay = useRef(true);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  // visibility, and the reduced-motion default
  useEffect(() => {
    wantPlay.current = !prefersReducedMotion();
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // only the middle reel plays, and only on screen
  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (i !== idx) {
        v.pause();
        return;
      }
      v.muted = muted;
      if (inView && wantPlay.current) void v.play().catch(() => {});
      else v.pause();
    });
  }, [idx, inView, muted]);

  // progress bar + ambient canvas, one rAF loop while on screen
  useEffect(() => {
    if (!inView) return;
    const ctx = canvasRef.current?.getContext("2d");
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const v = vids.current[idxRef.current];
      if (v) {
        const p = v.duration ? v.currentTime / v.duration : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (ctx && t - last > 100 && v.readyState >= 2) {
          // low alpha blends each frame into the last, so colour shifts ease in
          ctx.globalAlpha = 0.3;
          ctx.drawImage(v, 0, 0, AMBIENT_W, AMBIENT_H);
          last = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  if (n === 0) return null;

  const go = (to: number) => {
    const next = ((to % n) + n) % n;
    if (next === idx) return;
    const v = vids.current[next];
    if (v) v.currentTime = 0;
    setPlaying(false); // the new reel's own play event flips this back
    setIdx(next);
  };

  const toggle = () => {
    const v = vids.current[idx];
    if (!v) return;
    if (v.paused) {
      wantPlay.current = true;
      void v.play().catch(() => {});
    } else {
      wantPlay.current = false;
      v.pause();
    }
  };

  const cur = reels[idx];

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Reels from our trips"
      // clip, not hidden: a hidden box can still be scrolled sideways when focus
      // lands on a tilted side reel, which shoved the whole stage left
      className="relative isolate overflow-clip bg-ink py-[10vh] text-white"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(idx + 1);
        if (e.key === "ArrowLeft") go(idx - 1);
      }}
    >
      {/* the ambient canvas — the reel's own colours, blown up behind everything */}
      <canvas
        ref={canvasRef}
        width={AMBIENT_W}
        height={AMBIENT_H}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full scale-125 opacity-70 [filter:blur(64px)_saturate(1.6)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(26,22,20,0.85)_75%)]" />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-script text-2xl text-gold sm:text-3xl">{eyebrow}</p>
            <h2 className="mt-1 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              {headline} <span className="text-gold">{accent}</span>
            </h2>
          </div>
          {n > 1 && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums text-white/60">
                {String(idx + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => go(idx - 1)}
                aria-label="Previous reel"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-lg transition-colors hover:border-gold hover:text-gold"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => go(idx + 1)}
                aria-label="Next reel"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-lg transition-colors hover:border-gold hover:text-gold"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* the deck */}
        <div
          className="relative mx-auto mt-10 aspect-[9/16] w-[min(62vw,18rem)] touch-pan-y select-none [perspective:1400px] sm:mt-12"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, moved: false })}
          onPointerUp={(e) => {
            const s = swipe.current;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 40) {
              s.moved = true;
              go(idx + (dx < 0 ? 1 : -1));
            }
          }}
        >
          {reels.map((r, i) => {
            const o = offsetOf(i, idx, n);
            const a = Math.abs(o);
            const centre = o === 0;
            const shown = a <= SPAN;
            return (
              <div
                key={r.id}
                aria-hidden={!centre}
                className="absolute inset-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(${o * 64}%) scale(${1 - a * 0.17}) rotateY(${o * 18}deg)`,
                  opacity: shown ? 1 : 0,
                  zIndex: 10 - a,
                  pointerEvents: shown ? "auto" : "none",
                }}
              >
                <button
                  type="button"
                  tabIndex={centre ? 0 : -1}
                  onClick={() => {
                    // a swipe ends in a click on whatever was under the finger — swallow it once
                    const s = swipe.current;
                    swipe.current = null;
                    if (s?.moved) return;
                    if (centre) toggle();
                    else go(i);
                  }}
                  aria-label={centre ? (playing ? `Pause: ${r.title}` : `Play: ${r.title}`) : `Show reel: ${r.title}`}
                  className="group relative block h-full w-full overflow-hidden rounded-[1.75rem] bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15"
                >
                  <video
                    ref={(el) => {
                      vids.current[i] = el;
                    }}
                    src={r.poster ? r.video : `${r.video}#t=0.1`}
                    poster={r.poster}
                    muted
                    playsInline
                    loop={n === 1}
                    preload={shown ? "metadata" : "none"}
                    onPlay={() => i === idxRef.current && setPlaying(true)}
                    onPause={() => i === idxRef.current && setPlaying(false)}
                    onEnded={() => i === idxRef.current && go(i + 1)}
                    className="h-full w-full object-cover"
                  />
                  {/* side reels sit back in the dark */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-black transition-opacity duration-700"
                    style={{ opacity: centre ? 0 : 0.25 + a * 0.15 }}
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                  {r.place && (
                    <span className="absolute bottom-4 left-4 right-4 text-left text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/85">
                      {r.place}
                    </span>
                  )}
                  {centre && !playing && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  )}
                </button>

                {centre && (
                  <>
                    {/* where you are in the deck */}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
                      {reels.map((x, j) => (
                        <span key={x.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                          <span
                            ref={j === idx ? barRef : undefined}
                            className="block h-full origin-left bg-white"
                            style={{ transform: j < idx ? "scaleX(1)" : "scaleX(0)" }}
                          />
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? "Turn sound on" : "Turn sound off"}
                      aria-pressed={!muted}
                      className="absolute right-3 top-7 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                    >
                      {muted ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 5 6 9H2v6h4l5 4V5z" />
                          <path d="m23 9-6 6M17 9l6 6" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 5 6 9H2v6h4l5 4V5z" />
                          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* the caption for whatever is in the middle */}
        <div aria-live="polite" className="mx-auto mt-8 max-w-md text-center">
          {cur.title && <p className="font-display text-xl font-extrabold leading-snug sm:text-2xl">{cur.title}</p>}
          {(cur.place || cur.credit) && (
            <p className="mt-1.5 text-sm text-white/60">{[cur.place, cur.credit].filter(Boolean).join(" · ")}</p>
          )}
          {cur.href && (
            <Link
              href={cur.href}
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-gold px-6 text-sm font-extrabold text-ink transition-transform hover:scale-[1.03]"
            >
              See this trip →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
