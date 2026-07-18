"use client";

/* L40 — "Last Exit" (footer)
   The page ends on an open highway: a perspective road rushing to a
   glowing horizon, lane dashes streaming past, one road sign for a CTA.
   The most literal possible way to say "go". */

import { useEntrance } from "./shared";

export default function L40HorizonFooter() {
  const ref = useEntrance<HTMLElement>("top 75%");

  return (
    <footer ref={ref} className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-[#150f14]">
      {/* horizon glow */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[30%] h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(245,163,26,0.5),transparent_70%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[42%] bg-[linear-gradient(180deg,#150f14_0%,#3d1c22_78%,#c96a2e_100%)]" />

      {/* the road */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[58%]" style={{ perspective: "340px" }}>
        <div
          className="absolute inset-x-[-40%] bottom-0 h-full origin-bottom bg-[#211d22]"
          style={{ transform: "rotateX(72deg)" }}
        >
          {/* streaming centre dashes */}
          <div
            className="absolute inset-x-0 inset-y-[-100%] opacity-90"
            style={{
              backgroundImage: "linear-gradient(90deg, transparent 49.2%, #f5a31a 49.2%, #f5a31a 50.8%, transparent 50.8%)",
              backgroundSize: "100% 100%",
              WebkitMaskImage: "repeating-linear-gradient(180deg, black 0 90px, transparent 90px 150px)",
              maskImage: "repeating-linear-gradient(180deg, black 0 90px, transparent 90px 150px)",
              animation: "l40road 1.4s linear infinite",
            }}
          />
          {/* edge lines */}
          <div className="absolute inset-y-0 left-[24%] w-2 bg-[#5b5560]/80" />
          <div className="absolute inset-y-0 right-[24%] w-2 bg-[#5b5560]/80" />
        </div>
      </div>

      {/* the sign */}
      <div data-in className="relative mx-auto mb-[9vh] w-full max-w-2xl px-5 text-center">
        <div className="mx-auto w-fit rounded-2xl border-4 border-[#eae4d2] bg-[#0f5132] px-8 py-6 shadow-card-lg sm:px-14 sm:py-8">
          <p className="text-left font-display text-[0.66rem] font-bold uppercase tracking-[0.35em] text-[#eae4d2]/75">exit 350 · next 0 km</p>
          <p className="mt-2 text-left font-display text-3xl font-extrabold uppercase tracking-wide text-[#eae4d2] sm:text-5xl">
            Adventure <span className="align-middle text-gold">➜</span>
          </p>
          <p className="mt-1.5 text-left font-display text-sm font-bold uppercase tracking-[0.2em] text-[#eae4d2]/60">
            regret · keep straight
          </p>
        </div>
        <a href="#" className="mt-9 inline-flex min-h-13 items-center rounded-full bg-gold px-10 py-4.5 text-lg font-extrabold text-[#150f14] shadow-[0_18px_50px_rgba(245,163,26,0.4)] transition-transform hover:scale-[1.05]">
          Take the exit →
        </a>
      </div>

      {/* legal strip */}
      <div data-in className="relative border-t border-white/10 bg-[#120d11]/80 px-5 py-5 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/35">
          <p>© 2026 tripwaley</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Refunds", "Contact"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-gold">{l}</a>
            ))}
          </div>
          <p>drive-thru open 24/7</p>
        </div>
      </div>
    </footer>
  );
}
