"use client";

/* HERO 36 — "Solari"
   A full-screen Solari split-flap board (the Italian airport kind) as the
   entire hero. Each character mechanically flips through the alphabet to
   settle on the message, then the board re-flips to the next destination
   on a loop. Analog-luxury, deeply tactile. */

import { useEffect, useRef, useState } from "react";

const GLYPHS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·₹";

const BOARD = [
  { big: "LEH LADAKH", sub: "07 NIGHTS   ₹24999   3 SEATS" },
  { big: "SPITI RIVER", sub: "08 NIGHTS   ₹18999   BOARDING" },
  { big: "KERALA COAST", sub: "06 NIGHTS   ₹16999   ON TIME" },
  { big: "ANDAMAN BLUE", sub: "06 NIGHTS   ₹28999   6 SEATS" },
];

const COLS = 14;
const HOLD_MS = 3600;

/** one flap cell that animates from its current glyph to a target */
function Flap({ target, delay }: { target: string; delay: number }) {
  const [ch, setCh] = useState(" ");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const goal = target.toUpperCase();
    let cur = GLYPHS.indexOf(ch) < 0 ? 0 : GLYPHS.indexOf(ch);
    const goalIdx = Math.max(0, GLYPHS.indexOf(goal));
    let raf = 0;
    let started = false;
    const startT = performance.now() + delay;

    const step = (t: number) => {
      if (t < startT) { raf = requestAnimationFrame(step); return; }
      if (!started) started = true;
      if (cur !== goalIdx) {
        cur = (cur + 1) % GLYPHS.length;
        setCh(GLYPHS[cur]);
        // flip snap
        if (ref.current) {
          ref.current.style.transform = "rotateX(-88deg)";
          requestAnimationFrame(() => ref.current && (ref.current.style.transform = "rotateX(0deg)"));
        }
        setTimeout(() => { raf = requestAnimationFrame(step); }, 34);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay]);

  return (
    <span
      className="relative inline-flex items-center justify-center rounded-[3px] bg-[#141414] font-mono font-bold text-gold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.7),inset_0_2px_2px_rgba(255,255,255,0.06)]"
      style={{ width: "1.1em", height: "1.5em" }}
    >
      <span ref={ref} className="transition-transform duration-100 ease-out" style={{ transformOrigin: "center", backfaceVisibility: "hidden" }}>
        {ch}
      </span>
      {/* center split line */}
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/60" />
    </span>
  );
}

function Row({ text, size, delayBase }: { text: string; size: string; delayBase: number }) {
  const padded = text.toUpperCase().padEnd(COLS, " ").slice(0, COLS).split("");
  return (
    <div className={`flex justify-center gap-[0.15em] ${size}`} aria-label={text}>
      {padded.map((c, i) => (
        <Flap key={i} target={c} delay={delayBase + i * 55} />
      ))}
    </div>
  );
}

export default function Hero36SplitFlap() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setIdx((v) => (v + 1) % BOARD.length), HOLD_MS);
    return () => clearInterval(iv);
  }, []);

  const cur = BOARD[idx];

  return (
    <section className="noise relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-24">
      {/* board frame */}
      <div className="absolute inset-6 rounded-2xl border border-white/10 sm:inset-12" aria-hidden="true" />
      <div className="absolute inset-x-0 top-10 text-center sm:top-16">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.5em] text-white/40">Tripwaley · Terminal TW · Departures</p>
      </div>

      {/* the board */}
      <div className="w-full max-w-4xl space-y-4">
        <Row key={`big-${idx}`} text={cur.big} size="text-[clamp(1.4rem,6vw,3.6rem)]" delayBase={0} />
        <Row key={`sub-${idx}`} text={cur.sub} size="text-[clamp(0.6rem,2.4vw,1.4rem)]" delayBase={400} />
      </div>

      {/* legend / CTA */}
      <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 px-6 sm:bottom-16">
        <p className="max-w-lg text-center text-sm text-white/50">
          If it&apos;s on the board, it flies. No &ldquo;group too small, trip cancelled&rdquo; — every departure guaranteed.
        </p>
        <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#0a0a0a] transition-colors hover:bg-[#ffc45c]">
          Grab a boarding pass
        </a>
      </div>
    </section>
  );
}
