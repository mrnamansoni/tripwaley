"use client";

/* THE REEL — a cinematic video testimonial for the Destinations page.
   The brand is "a film by you", so the container is a projector: a screen
   that swings out of 3D space as you scroll, a warm beam with drifting dust
   motes (canvas), running film perforations, grain, and a word-by-word quote
   reveal. The <video> autoplays muted as an ambient loop and unmutes on tap,
   with a progress ring. Degrades to a still, composed frame under
   prefers-reduced-motion. Admin-editable via Settings → Video testimonial. */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { VideoTestimonial } from "@/lib/types";

export default function VideoReel({ vt }: { vt: VideoTestimonial }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [reduced, setReduced] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1

  const hasVideo = vt.videoUrl.trim().length > 0;
  const words = vt.quote.split(/\s+/).filter(Boolean);

  /* ---- reduced-motion probe ---- */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  /* ---- scroll-scrubbed 3D orchestration ---- */
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        { desk: "(min-width: 768px)", mob: "(max-width: 767px)" },
        (c) => {
          const isMob = c.conditions!.mob;
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
            },
          });
          tl.fromTo(
            screenRef.current,
            { rotateY: isMob ? -14 : -26, rotateX: isMob ? 6 : 11, scale: isMob ? 0.74 : 0.6, z: -160, yPercent: 6 },
            { rotateY: 0, rotateX: 0, scale: 1, z: 0, yPercent: 0, ease: "power2.out", duration: 1 },
            0
          )
            .fromTo(glowRef.current, { opacity: 0.12 }, { opacity: 0.6, duration: 0.6 }, 0)
            .fromTo(beamRef.current, { opacity: 0, scaleY: 0.7 }, { opacity: 1, scaleY: 1, duration: 0.55 }, 0.1)
            .fromTo(hudRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.5)
            .fromTo(
              "[data-reel-word]",
              { opacity: 0, yPercent: 120 },
              { opacity: 1, yPercent: 0, stagger: 0.035, duration: 0.5, ease: "power2.out" },
              0.55
            )
            .fromTo(cardRef.current, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.45 }, 0.72);
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  /* ---- dust motes catching the beam (canvas) ---- */
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctxc = canvas.getContext("2d");
    if (!ctxc) return;

    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; t: number };
    let motes: Mote[] = [];

    const seed = () => {
      const rect = stage.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctxc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(46, (w * h) / 26000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.05 - Math.random() * 0.22,
        a: 0.05 + Math.random() * 0.4,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const tick = () => {
      if (!running) return;
      ctxc.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.t += 0.02;
        m.x += m.vx + Math.sin(m.t) * 0.12;
        m.y += m.vy;
        if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
        if (m.x < -6) m.x = w + 6;
        if (m.x > w + 6) m.x = -6;
        // motes brighten toward the vertical centre (the beam)
        const beam = 1 - Math.min(1, Math.abs(m.x - w / 2) / (w * 0.42));
        const alpha = m.a * (0.25 + beam * 0.9);
        ctxc.beginPath();
        ctxc.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctxc.fillStyle = `rgba(247, 226, 190, ${alpha.toFixed(3)})`;
        ctxc.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    seed();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(tick); }
        else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
      },
      { threshold: 0.05 }
    );
    io.observe(stage);
    const ro = new ResizeObserver(seed);
    ro.observe(stage);
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [reduced]);

  /* ---- ambient autoplay: only when the reel is on screen ---- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [hasVideo]);

  const onTime = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress(v.currentTime / v.duration);
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) { v.muted = false; setMuted(false); v.play().catch(() => {}); setPlaying(true); }
    else if (playing) { v.pause(); setPlaying(false); }
    else { v.play().catch(() => {}); setPlaying(true); }
  };

  const R = 26;
  const CIRC = 2 * Math.PI * R;

  return (
    <section
      ref={sectionRef}
      aria-label="Video testimonial"
      className={`reel-root relative bg-[#0b0908] ${reduced ? "py-20" : "h-[210vh] sm:h-[270vh]"}`}
    >
      <ReelStyles />
      <div
        ref={stageRef}
        className={`${reduced ? "" : "sticky top-0 h-screen"} flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6`}
        style={{ perspective: "1600px", perspectiveOrigin: "50% 42%" }}
      >
        {/* warm auditorium glow */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 80% at 50% 40%, rgba(158,96,40,0.42), rgba(11,9,8,0) 62%)" }}
        />
        {/* projector beam */}
        <div
          ref={beamRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2 origin-top mix-blend-screen"
          style={{
            background: "conic-gradient(from 180deg at 50% 0%, rgba(0,0,0,0) 47%, rgba(245,210,150,0.16) 50%, rgba(0,0,0,0) 53%)",
          }}
        />
        {/* dust motes */}
        {!reduced && <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />}

        {/* eyebrow */}
        <div ref={hudRef} className="relative z-10 mb-6 text-center sm:mb-8">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.5em] text-gold/80">reel 01 — from the batch</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Roll the <span className="text-gold">real thing.</span>
          </h2>
        </div>

        {/* THE SCREEN */}
        <div className="relative z-10 w-full max-w-3xl" style={{ transformStyle: "preserve-3d" }}>
          <div
            ref={screenRef}
            className="reel-screen relative aspect-video w-full overflow-hidden rounded-xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* film perforation rails */}
            <span aria-hidden="true" className="reel-perf reel-perf-l" />
            <span aria-hidden="true" className="reel-perf reel-perf-r" />

            {/* media */}
            <div className="absolute inset-y-0 left-[7%] right-[7%] overflow-hidden bg-black">
              {hasVideo ? (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  src={vt.videoUrl}
                  poster={vt.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onTimeUpdate={onTime}
                  aria-label={`Video testimonial from ${vt.name}`}
                />
              ) : (
                <div className={`h-full w-full ${reduced ? "" : "reel-kenburns"}`}>
                  <Image src={vt.poster} alt={`${vt.name} on a Tripwaley batch`} fill sizes="(max-width:768px) 92vw, 768px" className="object-cover" />
                </div>
              )}
              {/* legibility scrim */}
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* lower-third quote */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
                <blockquote className="max-w-xl overflow-hidden">
                  <p className="font-display text-lg font-bold leading-snug text-white [text-wrap:balance] sm:text-2xl">
                    <span aria-hidden="true">
                      {words.map((wd, i) => (
                        <span key={i} className="inline-block overflow-hidden align-bottom">
                          <span data-reel-word className="inline-block">{wd}&nbsp;</span>
                        </span>
                      ))}
                    </span>
                    <span className="sr-only">&ldquo;{vt.quote}&rdquo;</span>
                  </p>
                </blockquote>
              </div>

              {/* sound / play control with progress ring */}
              {hasVideo && (
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={muted ? "Play with sound" : playing ? "Pause" : "Play"}
                  className="group absolute right-3 top-3 flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-5 sm:top-5"
                >
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                    <circle cx="30" cy="30" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" />
                    <circle
                      cx="30" cy="30" r={R} fill="none" stroke="var(--reel-gold)" strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={CIRC} strokeDashoffset={muted ? CIRC : CIRC * (1 - progress)}
                      style={{ transition: "stroke-dashoffset .2s linear" }}
                    />
                  </svg>
                  <span aria-hidden="true" className="relative">
                    {muted ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path d="M16 9l4 6M20 9l-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    ) : playing ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
                    )}
                  </span>
                </button>
              )}

              {!hasVideo && (
                <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-white/70 backdrop-blur-md sm:right-5 sm:top-5">
                  silent cut
                </span>
              )}
            </div>

            {/* frame HUD marks */}
            <span aria-hidden="true" className="absolute left-[7%] top-2 font-mono text-[0.52rem] uppercase tracking-widest text-white/45">● rec</span>
            <span aria-hidden="true" className="absolute right-[7%] top-2 font-mono text-[0.52rem] uppercase tracking-widest text-white/45 [font-variant-numeric:tabular-nums]">4.9★ verified</span>

            {/* grain + vignette */}
            <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${reduced ? "" : "reel-grain"}`} />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px 24px rgba(0,0,0,0.6)" }} />
          </div>

          {/* attribution card */}
          <div ref={cardRef} className="relative z-10 mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-extrabold text-ink">
              {vt.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{vt.name}</p>
              <p className="truncate text-xs text-white/50">{vt.trip}{vt.location ? ` · ${vt.location}` : ""}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-success/15 px-3 py-1 text-[0.56rem] font-bold uppercase tracking-wider text-success">verified batch</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* keyframes + film details, scoped to the reel. Reduced-motion freezes them. */
function ReelStyles() {
  return (
    <style>{`
      .reel-root { --reel-gold: #f5b32a; }
      .reel-screen {
        background: linear-gradient(#1b1510, #0d0a07);
        box-shadow: 0 40px 90px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,220,160,0.06);
      }
      .reel-perf {
        position: absolute; top: 0; bottom: 0; width: 7%; z-index: 2;
        background-image: radial-gradient(circle at 50% 9px, transparent 3px, #0a0805 3.6px);
        background-size: 100% 22px; background-repeat: repeat-y;
        background-color: #241b12;
        box-shadow: inset 0 0 12px rgba(0,0,0,0.7);
      }
      .reel-perf-l { left: 0; } .reel-perf-r { right: 0; }
      .reel-screen .reel-perf { animation: reel-run 1.1s linear infinite; }
      @keyframes reel-run { from { background-position-y: 0; } to { background-position-y: 22px; } }
      .reel-kenburns { animation: reel-kb 18s ease-in-out infinite alternate; transform-origin: 60% 40%; }
      @keyframes reel-kb { from { transform: scale(1.04); } to { transform: scale(1.16) translate(-2%, 1%); } }
      .reel-grain {
        opacity: .5; mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        background-size: 180px 180px;
        animation: reel-grain-move .5s steps(3) infinite;
      }
      @keyframes reel-grain-move {
        0% { background-position: 0 0; } 33% { background-position: -60px 30px; }
        66% { background-position: 40px -50px; } 100% { background-position: -30px 20px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .reel-screen .reel-perf, .reel-kenburns, .reel-grain { animation: none !important; }
      }
    `}</style>
  );
}
