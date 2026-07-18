"use client";

/* HERO 23 — "The Lens"
   Ivory gallery wall, giant ink serif. Your cursor is a lens: wherever it
   moves, the typography gives way to the photograph hiding underneath.
   Touch devices get a slow, self-panning lens. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero23Lens() {
  const ref = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const reveal = revealRef.current;
    if (!el || !reveal) return;

    const pos = { x: 0.5, y: 0.45 };
    const target = { x: 0.5, y: 0.45 };
    let hasPointer = false;
    let raf = 0;
    let auto = 0;

    const tick = () => {
      // damped lens follow; idle mode pans on its own
      if (!hasPointer) {
        auto += 0.004;
        target.x = 0.5 + Math.sin(auto) * 0.28;
        target.y = 0.45 + Math.cos(auto * 0.7) * 0.18;
      }
      pos.x += (target.x - pos.x) * 0.07;
      pos.y += (target.y - pos.y) * 0.07;
      const r = el.getBoundingClientRect();
      const m = `radial-gradient(${Math.min(r.width, 620) * 0.28}px circle at ${pos.x * r.width}px ${pos.y * r.height}px, black 62%, transparent 100%)`;
      reveal.style.webkitMaskImage = m;
      reveal.style.maskImage = m;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hasPointer = true;
      const r = el.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
    };
    el.addEventListener("pointermove", onMove, { passive: true });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-lens-in]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.14, scrollTrigger: { trigger: el, start: "top 62%" } }
      );
    }, el);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-[#f6f1e8]">
      {/* base layer: ink type on ivory */}
      <Headline />

      {/* lens layer: same composition over the hidden photograph */}
      <div
        ref={revealRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/meghalaya.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          WebkitMaskImage: "radial-gradient(0px circle at 50% 50%, black 60%, transparent 100%)",
          maskImage: "radial-gradient(0px circle at 50% 50%, black 60%, transparent 100%)",
        }}
      >
        <div className="absolute inset-0 bg-ink/25" />
        <Headline muted />
      </div>

      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.6rem] font-bold uppercase tracking-[0.35em] text-ink/35">
        the lens never lies
      </p>
    </section>
  );
}

/* the same composition twice: once in ink, once inverted under the lens */
function Headline({ muted }: { muted?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p data-lens-in={muted ? undefined : true} className={`text-[0.62rem] font-semibold uppercase tracking-[0.5em] ${muted ? "text-white/85" : "text-brand"}`}>
        Look closer
      </p>
      <h1
        data-lens-in={muted ? undefined : true}
        className={`mt-6 max-w-5xl text-6xl font-light leading-[1.02] sm:text-8xl lg:text-9xl ${muted ? "text-white" : "text-ink"}`}
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        Some places
        <br />
        <em className="italic">hide</em> in plain sight
      </h1>
      <p data-lens-in={muted ? undefined : true} className={`mt-8 max-w-md text-sm leading-relaxed ${muted ? "text-white/80" : "text-ink/60"}`}>
        Move your cursor. India works the same way — you only see it when you
        actually go looking.
      </p>
      <a
        data-lens-in={muted ? undefined : true}
        href="#"
        className={`mt-10 border px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] transition-colors duration-500 ${
          muted ? "border-white text-white hover:bg-white hover:text-ink" : "border-ink text-ink hover:bg-ink hover:text-cream"
        }`}
      >
        Go looking
      </a>
    </div>
  );
}
