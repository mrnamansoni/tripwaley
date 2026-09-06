"use client";

/* READ MORE.
 *
 * Long copy clamped to a few lines with a real toggle.
 *
 * Clamping is done with CSS line-clamp rather than by truncating the string,
 * which matters for two reasons: the FULL text stays in the DOM, so search
 * engines and screen readers get all of it, and the toggle can't disagree with
 * what was measured. Truncating in JS would also reflow differently at every
 * breakpoint and hand Google a shorter page than a visitor sees.
 *
 * The button is a real <button> with aria-expanded, and it only renders when
 * the text is actually overflowing — a paragraph that fits shouldn't grow a
 * pointless "Read more" underneath it.
 */

import { useEffect, useRef, useState } from "react";

export default function ReadMore({
  children,
  lines = 4,
  className = "",
  moreLabel = "Read more",
  lessLabel = "Show less",
  tone = "dark",
}: {
  children: React.ReactNode;
  /** how many lines to show when collapsed */
  lines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
  /** which surface this sits on, so the toggle stays legible on both */
  tone?: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Only offer the toggle when the copy genuinely overflows. Measured after
     layout and again on resize, because the same paragraph clamps on a phone
     and fits on a desktop. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Compare the content's natural height against the height N lines would
     * occupy. The obvious approach — set line-clamp and diff scrollHeight
     * against clientHeight — silently measures nothing, because line-clamp
     * does nothing without `display:-webkit-box` and `overflow:hidden`, and
     * those are only applied once we have decided to clamp. That is circular:
     * never clamped, so never overflowing, so never clamped, and the toggle
     * never appears at all. Measuring line height sidesteps the cycle, and
     * works whether the block is currently open or collapsed — with
     * -webkit-box, scrollHeight still reports the full content height. */
    const measure = () => {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      if (!lh) return;
      setClamped(el.scrollHeight > lh * lines + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lines, children]);

  const collapsed = clamped && !open;

  return (
    <div className={className}>
      <div
        ref={ref}
        style={
          collapsed
            ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }
            : undefined
        }
      >
        {children}
      </div>

      {clamped && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`mt-2 inline-flex items-center gap-1 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] transition-colors ${
            tone === "dark"
              ? "text-gold hover:text-white"
              : "text-brand hover:text-ink"
          }`}
        >
          {open ? lessLabel : moreLabel}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>↓</span>
        </button>
      )}
    </div>
  );
}
