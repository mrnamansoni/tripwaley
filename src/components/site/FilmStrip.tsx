"use client";

/* THE CONTACT SHEET — package gallery (their lab1-07 film-strip pick).
   Two counter-scrolling strips of sprocket-holed film cells carrying the
   package's imagery; velocity leans the strips as you scroll past. */

import { useEffect, useRef } from "react";
import SiteMedia from "./SiteMedia";
import { gsap, ScrollTrigger } from "@/lib/gsap";

function Strip({ images, label, reverse, dur }: { images: string[]; label: string; reverse?: boolean; dur: number }) {
  const cells = [...images, ...images, ...images];
  return (
    <div className="overflow-hidden">
      <div className={`marquee-track gap-0 ${reverse ? "marquee-reverse" : ""}`} style={{ "--marquee-duration": `${dur}s` } as React.CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {cells.map((src, i) => (
              <div key={`${copy}-${i}`} className="border-x border-black/60 bg-[#0c0b09] px-1.5 py-2">
                {/* sprockets */}
                <div className="mb-1.5 flex justify-between px-1" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <span key={j} className="h-1.5 w-2.5 rounded-[2px] bg-[#242118]" />
                  ))}
                </div>
                <div className="relative h-32 w-48 overflow-hidden sm:h-40 sm:w-60">
                  <SiteMedia src={src} alt="" fill sizes="240px" className="object-cover" />
                  <span className="absolute bottom-1 right-1.5 font-mono text-[0.5rem] font-bold tracking-widest text-gold/80">
                    {label} · {String((i % images.length) + 1).padStart(2, "0")}A
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between px-1" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <span key={j} className="h-1.5 w-2.5 rounded-[2px] bg-[#242118]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilmStrip({ images, code }: { images: string[]; code: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const strips = gsap.utils.toArray<HTMLElement>("[data-fs-strip]");
      const lean = gsap.quickTo(strips, "skewY", { duration: 0.5, ease: "power2.out" });
      ScrollTrigger.create({
        trigger: ref.current, start: "top bottom", end: "bottom top",
        onUpdate: (self) => lean(gsap.utils.clamp(-3.5, 3.5, self.getVelocity() / 600)),
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="overflow-hidden bg-[#080706] py-10">
      <p className="mb-5 text-center font-mono text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/40">
        contact sheet · roll {code} · shot by previous batches
      </p>
      <div className="-rotate-1 space-y-2">
        <div data-fs-strip className="will-change-transform">
          <Strip images={images} label={code} dur={40} />
        </div>
        <div data-fs-strip className="will-change-transform">
          <Strip images={[...images].reverse()} label={code} reverse dur={52} />
        </div>
      </div>
    </section>
  );
}
