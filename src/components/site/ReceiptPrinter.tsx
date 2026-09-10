"use client";

/* THE RECEIPT PRINTER — what a confirmed payment looks like.
 *
 * Adapted from a component the owner found, rebuilt on this site's own terms.
 * The reference used motion/react for the feed animation and @phosphor-icons
 * for the status glyphs; neither is installed here, and adding a second
 * animation runtime beside GSAP to move one element down a track would be a
 * poor trade for ~50KB on the page that confirms a payment. The paper feed is
 * CSS keyframes, the torn edge is the same clip-path technique, and the palette
 * is ink/cream/brand/gold rather than a grayscale token set we don't have.
 *
 * The stepped feed is the point of it: a thermal printer advances the paper a
 * line at a time, so the motion pauses between steps rather than gliding. That
 * is what makes it read as printing instead of sliding.
 *
 * The whole thing is decorative. Everything it prints is also present as plain
 * text on the page for anyone who can't see it, and the printer itself is
 * aria-hidden — a screen reader gets the real content, not a description of an
 * animation. Under prefers-reduced-motion the paper is simply already out.
 */

import { useEffect, useRef, useState } from "react";

export interface ReceiptLine {
  label: string;
  value: string;
  /** a running total or the amount actually charged */
  strong?: boolean;
}

export default function ReceiptPrinter({
  brand = "tripwaley",
  title,
  reference,
  lines,
  paidLabel,
  paidValue,
  footer,
  meta,
}: {
  brand?: string;
  /** the trip, printed as the receipt's heading */
  title: string;
  /** order id — the thing a customer quotes back to us */
  reference: string;
  lines: ReceiptLine[];
  paidLabel: string;
  paidValue: string;
  footer: string;
  /** small print under the barcode: date, contact */
  meta: string[];
}) {
  const [stage, setStage] = useState<"printing" | "done">("printing");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Always a timer, never a synchronous setState in the effect body — that
       triggers a cascading render, and the linter is right to refuse it. With
       reduced motion the CSS already skips the feed, so a 0ms delay just flips
       the status label on the next tick.

       A timer rather than an animationend listener because the paper must end
       up visible even if the animation never runs at all — a receipt stuck
       inside the machine is worse than one that appears without ceremony. */
    const t = setTimeout(() => setStage("done"), reduced ? 0 : 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={root} className="mx-auto w-full max-w-sm select-none">
      {/* ---------------- the machine ---------------- */}
      <div className="relative z-20 rounded-[1.5rem] border border-black/40 bg-gradient-to-b from-[#2a2523] to-[#171413] p-3 pb-7 shadow-card-lg">
        <div className="noise absolute inset-0 rounded-[1.5rem] opacity-40" aria-hidden="true" />

        <div className="relative flex items-center justify-between px-1 pb-3">
          <span className="font-script text-lg text-gold">{brand}</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${stage === "done" ? "bg-success" : "bg-gold animate-pulse motion-reduce:animate-none"}`}
              aria-hidden="true"
            />
            <span className="font-mono text-[0.52rem] uppercase tracking-[0.24em] text-white/45">
              {stage === "done" ? "printed" : "printing"}
            </span>
          </span>
        </div>

        {/* the little screen */}
        <div className="relative overflow-hidden rounded-xl border border-black/50 bg-[#0d0b0a] px-4 py-3 shadow-inner">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate font-display text-sm font-extrabold text-white/85">{title}</p>
            <p className="font-display text-base font-extrabold text-gold">{paidValue}</p>
          </div>
          <p className="mt-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/35">
            ref {reference}
          </p>
        </div>

        {/* the slot the paper comes out of */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 bottom-3 h-2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* ---------------- the paper ---------------- */}
      <div className="relative z-10 -mt-3 overflow-hidden px-3">
        <div
          data-receipt-paper
          data-stage={stage}
          className="relative bg-[#f7f2e4] px-6 pb-8 pt-7 text-ink shadow-card-lg"
        >
          <h2 className="text-center font-display text-xl font-extrabold leading-tight">{title}</h2>
          <p className="mt-1 text-center font-mono text-[0.55rem] uppercase tracking-[0.28em] text-ink/45">
            seat confirmation
          </p>

          <div className="my-4 border-t border-dashed border-ink/25" aria-hidden="true" />

          <dl className="space-y-2">
            {lines.map((l) => (
              <div key={l.label} className="flex items-baseline justify-between gap-4">
                <dt className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-ink/55">{l.label}</dt>
                <dd className={`text-right text-[0.82rem] ${l.strong ? "font-display text-base font-extrabold text-ink" : "font-semibold text-ink/80"}`}>
                  {l.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="my-4 border-t border-dashed border-ink/25" aria-hidden="true" />

          <div className="flex items-baseline justify-between gap-4">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/60">{paidLabel}</span>
            <span className="font-display text-2xl font-extrabold text-brand">{paidValue}</span>
          </div>

          <p className="mt-5 text-center text-[0.74rem] leading-relaxed text-ink/60">{footer}</p>

          {/* a barcode, drawn rather than encoded — it is ornament, and a real
              one would imply it scans to something */}
          <div className="mt-5 flex h-9 items-end justify-center gap-[2px]" aria-hidden="true">
            {Array.from({ length: 42 }).map((_, i) => (
              <span key={i} className="w-[2px] bg-ink" style={{ height: `${45 + ((i * 53) % 55)}%` }} />
            ))}
          </div>
          <p className="mt-2 text-center font-mono text-[0.58rem] tracking-[0.2em] text-ink/70">{reference}</p>

          {meta.length > 0 && (
            <p className="mt-4 text-center font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink/40">
              {meta.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <style>{`
        /* The torn edge: a row of triangles clipped off the bottom. */
        [data-receipt-paper] {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px)${Array.from({ length: 60 }, (_, i) => {
            const x = 100 - ((i + 1) * 100) / 60;
            return `, ${x}% ${i % 2 === 0 ? "100%" : "calc(100% - 6px)"}`;
          }).join("")});
        }
        /* Stepped feed — a thermal printer advances a line at a time, so each
           step holds before the next. A smooth translate reads as sliding. */
        [data-receipt-paper][data-stage="printing"] {
          animation: tw-feed 2.2s steps(1, end) both;
        }
        @keyframes tw-feed {
          0%   { transform: translateY(-100%); }
          10%  { transform: translateY(-88%);  }
          20%  { transform: translateY(-76%);  }
          30%  { transform: translateY(-63%);  }
          40%  { transform: translateY(-50%);  }
          50%  { transform: translateY(-38%);  }
          60%  { transform: translateY(-27%);  }
          70%  { transform: translateY(-17%);  }
          80%  { transform: translateY(-9%);   }
          90%  { transform: translateY(-3%);   }
          100% { transform: translateY(0);     }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-receipt-paper][data-stage="printing"] { animation: none; transform: none; }
        }
      `}</style>
    </div>
  );
}
