"use client";

/* HERO 34 — "Everywhere You Look"
   The cult awwwards move: photographs bloom along your cursor's wake and
   melt away — the page itself daydreams wherever you point. Touch devices
   get an idle hand that wanders on its own. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const TRAIL_IMGS = [
  "/images/ladakh.jpg", "/images/kerala.jpg", "/images/andaman.jpg",
  "/images/spiti.jpg", "/images/rajasthan.jpg", "/images/meghalaya.jpg",
  "/images/stars.jpg", "/images/kashmir.jpg",
];
const SPAWN_DIST = 110;

export default function Hero34CursorTrail() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const stage = stageRef.current;
    if (!el || !stage) return;

    let last = { x: -9e3, y: -9e3 };
    let n = 0;
    let idleRaf = 0;
    let sawMouse = false;

    const spawn = (x: number, y: number) => {
      const img = document.createElement("img");
      img.src = TRAIL_IMGS[n % TRAIL_IMGS.length];
      img.alt = "";
      img.className = "pointer-events-none absolute w-40 rounded-xl object-cover shadow-card-lg sm:w-52";
      img.style.aspectRatio = "4/3";
      stage.appendChild(img);
      n++;
      gsap.fromTo(
        img,
        { x: x - 96, y: y - 72, scale: 0.4, rotate: (Math.random() - 0.5) * 26, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.45, ease: "power3.out" }
      );
      gsap.to(img, {
        autoAlpha: 0,
        scale: 0.86,
        y: `+=${34}`,
        delay: 0.55,
        duration: 0.7,
        ease: "power2.in",
        onComplete: () => img.remove(),
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") sawMouse = true;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.hypot(x - last.x, y - last.y) > SPAWN_DIST) {
        last = { x, y };
        spawn(x, y);
      }
    };
    el.addEventListener("pointermove", onMove, { passive: true });

    /* idle daydream for touch / before first mouse move */
    let t = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const idle = () => {
      idleRaf = requestAnimationFrame(idle);
      if (!visible || sawMouse) return;
      t += 0.012;
      const r = el.getBoundingClientRect();
      const x = r.width * (0.5 + Math.sin(t) * 0.33);
      const y = r.height * (0.5 + Math.sin(t * 1.7) * 0.26);
      if (Math.hypot(x - last.x, y - last.y) > SPAWN_DIST) {
        last = { x, y };
        spawn(x, y);
      }
    };
    idleRaf = requestAnimationFrame(idle);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-ct-in]",
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 60%" } }
      );
    }, el);

    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(idleRaf);
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream">
      {/* type sits UNDER the blooming photos */}
      <div className="px-6 text-center">
        <p data-ct-in className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-brand">
          move your cursor · that&apos;s it · that&apos;s the demo
        </p>
        <h1 data-ct-in className="mt-6 font-display text-[clamp(3.2rem,11vw,9.5rem)] font-extrabold leading-[0.95] tracking-tight text-ink">
          Look anywhere.
          <br />
          There&apos;s a <span className="text-brand">trip.</span>
        </h1>
        <p data-ct-in className="mx-auto mt-7 max-w-md text-base leading-relaxed text-ink/60">
          14 states, 350 departures a year. Your cursor just proved the point.
        </p>
        <a
          data-ct-in
          href="#"
          className="mt-9 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright"
        >
          Chase one down →
        </a>
      </div>

      {/* trail layer */}
      <div ref={stageRef} aria-hidden="true" className="absolute inset-0 overflow-hidden" />
    </section>
  );
}
