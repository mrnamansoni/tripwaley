"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { CaseNote, NameTape, Pin, Polaroid, Stamp, type CaseSubject } from "./caseBits";

/* THE BOARD — the case file on a laptop, told as one camera move.

   The section pins and scroll drives a camera over a dark evidence board.
   It opens wide on grey, unidentified faces, then pushes in on the founder,
   pinned dead centre, and the first case note slides in. For everyone after,
   the camera pulls back to watch a red thread run out from the founder, then
   follows it in; the face it reaches turns from grey to colour, because now
   we know who they are. At the end it pulls back to the whole board.

   Only for lg screens with motion allowed (see .case-board in globals.css);
   everyone else gets CaseList, the same file as a stack of pages. */

/* where each head is pinned, as % of the board, for each team size. Hand
   placed rather than computed so the board never reads as a diagram. */
const FOUNDER: [number, number] = [50, 46];
const SLOTS: Record<number, [number, number][]> = {
  1: [[75, 42]],
  2: [[23, 44], [77, 42]],
  3: [[22, 30], [78, 32], [24, 75]],
  4: [[22, 29], [78, 31], [21, 74], [79, 72]],
  5: [[21, 28], [79, 29], [17, 72], [83, 70], [62, 85]],
  6: [[21, 27], [79, 28], [14, 67], [86, 65], [35, 85], [65, 86]],
};
function slotsFor(n: number): [number, number][] {
  if (SLOTS[n]) return SLOTS[n];
  // a bigger paltan goes round an oval, starting top-left
  return Array.from({ length: n }, (_, i) => {
    const a = ((-150 + (360 / n) * i) * Math.PI) / 180;
    return [50 + 38 * Math.cos(a), 50 + 37 * Math.sin(a)] as [number, number];
  });
}

/* the wide shot leaves a band at the top for the titles */
const WIDE = 0.76;

/* a hand-drawn marker loop: a little over one turn, wobbling */
function loopPath(seed: number): string {
  const pts: string[] = [];
  for (let k = 0; k <= 44; k++) {
    const t = (k / 40) * Math.PI * 2 - 2.1;
    const wob = 1 + 0.035 * Math.sin(k * 1.7 + seed) + (k / 44) * 0.06;
    pts.push(`${(50 + 47 * wob * Math.cos(t)).toFixed(1)},${(62 + 58 * wob * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

export default function CaseBoard({ subjects }: { subjects: CaseSubject[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const n = subjects.length;
  const people = subjects.reduce((k, s) => k + 1 + s.crew.length, 0);
  const spots: [number, number][] = [FOUNDER, ...slotsFor(n - 1)];

  useEffect(() => {
    const stage = stageRef.current;
    const board = boardRef.current;
    const svg = svgRef.current;
    if (!stage || !board || !svg) return;

    /* board geometry in px, re-read before every ScrollTrigger refresh. Layout
       sizes only (offsetHeight), so the camera's own transform never skews it. */
    const geo = { w: 0, h: 0, pts: [] as { x: number; cy: number; pin: number; ph: number }[] };
    const measure = () => {
      geo.w = stage.clientWidth;
      geo.h = stage.clientHeight;
      geo.pts = spots.map(([x, y], i) => {
        const photo = board.querySelector<HTMLElement>(`[data-photo="${i}"]`);
        const ph = photo?.offsetHeight ?? 200;
        const top = (y / 100) * geo.h - (photo?.parentElement?.offsetHeight ?? ph) / 2;
        return { x: (x / 100) * geo.w, cy: top + ph / 2, pin: top + 11, ph };
      });
      // the thread runs pin to pin and sags a little, like real string
      svg.setAttribute("viewBox", `0 0 ${geo.w} ${geo.h}`);
      const a = geo.pts[0];
      svg.querySelectorAll<SVGPathElement>("[data-thread]").forEach((path) => {
        const b = geo.pts[Number(path.dataset.thread)];
        const sag = 14 + Math.hypot(b.x - a.x, b.pin - a.pin) * 0.09;
        path.setAttribute("d", `M${a.x},${a.pin} Q${(a.x + b.x) / 2},${(a.pin + b.pin) / 2 + sag} ${b.x},${b.pin}`);
      });
    };
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(stage);
      const wide = { scale: WIDE, x: () => ((1 - WIDE) / 2) * geo.w, y: () => (0.985 - WIDE) * geo.h };
      // close-up: subject i at a third of the screen, the note beside them
      const close = (i: number) => {
        const s = () => gsap.utils.clamp(1.1, 2.4, (0.5 * geo.h) / geo.pts[i].ph);
        return { scale: s, x: () => 0.3 * geo.w - geo.pts[i].x * s(), y: () => 0.54 * geo.h - geo.pts[i].cy * s() };
      };
      // pulled back between the founder and subject i, to watch the thread run
      const between = (i: number) => {
        const s = 1.05;
        const mid = () => ({ x: (geo.pts[0].x + geo.pts[i].x) / 2, y: (geo.pts[0].cy + geo.pts[i].cy) / 2 });
        return { scale: s, x: () => 0.5 * geo.w - mid().x * s, y: () => 0.54 * geo.h - mid().y * s };
      };

      gsap.set(board, { transformOrigin: "0 0", ...wide });
      gsap.set(q("[data-note]"), { opacity: 0, x: 60, rotate: 3 });
      gsap.set(q("[data-hl]"), { backgroundSize: "0% 0.5em" });
      gsap.set(q("[data-thread], [data-loop]"), { strokeDashoffset: 1 });
      gsap.set(q("[data-outro]"), { opacity: 0, y: 24 });
      gsap.set(q("[data-closed]"), { opacity: 0, scale: 1.9 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${geo.h * (n * 1.05 + 1.3)}`,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(q("[data-intro]"), { opacity: 0, y: -28, filter: "blur(8px)", duration: 0.5 }, 0.1);
      subjects.forEach((_, i) => {
        let at = 0.2;
        if (i === 0) {
          tl.to(board, { ...close(0), duration: 1 }, at);
        } else {
          at = tl.duration();
          tl.to(q(`[data-note="${i - 1}"]`), { opacity: 0, x: -40, rotate: -2, duration: 0.35, ease: "power2.in" }, at);
          tl.to(q(`[data-loop="${i - 1}"]`), { opacity: 0, duration: 0.3 }, at);
          tl.to(board, { ...between(i), duration: 0.5 }, at);
          tl.to(q(`[data-thread="${i}"]`), { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, at + 0.25);
          tl.to(board, { ...close(i), duration: 0.6 }, at + 0.55);
          at += 0.15;
        }
        tl.to(q(`[data-face="${i}"]`), { filter: "grayscale(0) brightness(1)", duration: 0.45, ease: "power1.out" }, at + 0.6);
        tl.to(q(`[data-note="${i}"]`), { opacity: 1, x: 0, rotate: -1.2, duration: 0.45, ease: "power3.out" }, at + 0.7);
        tl.to(q(`[data-loop="${i}"]`), { strokeDashoffset: 0, duration: 0.4, ease: "power1.inOut" }, at + 0.85);
        tl.to(q(`[data-note="${i}"] [data-hl]`), { backgroundSize: "100% 0.5em", duration: 0.5, ease: "none" }, at + 1);
        tl.to({}, { duration: 0.65 });
      });

      const end = tl.duration();
      tl.to(q(`[data-note="${n - 1}"]`), { opacity: 0, x: -40, duration: 0.35, ease: "power2.in" }, end);
      tl.to(q("[data-loop]"), { opacity: 0, duration: 0.3 }, end);
      tl.to(board, { ...wide, duration: 1.1 }, end);
      tl.to(q("[data-outro]"), { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, end + 0.7);
      tl.to(q("[data-closed]"), { opacity: 1, scale: 1, duration: 0.22, ease: "power4.in" }, end + 1);
      tl.to({}, { duration: 0.6 });
    });

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      mm.revert();
    };
    // the subject list is fixed for the life of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div ref={stageRef} className="case-board relative h-screen overflow-hidden bg-ink">
      {/* the board itself: everything the camera moves over */}
      <div ref={boardRef} aria-hidden="true" className="case-felt noise absolute inset-0">
        <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
          {subjects.slice(1).map((s, k) => (
            <path key={s.id} data-thread={k + 1} pathLength={1} strokeDasharray="1" className="case-thread" />
          ))}
        </svg>

        {subjects.map((s, i) => (
          <div
            key={s.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%`, width: i === 0 ? "calc(var(--cu) * 21)" : "calc(var(--cu) * 15)" }}
          >
            <span data-photo={i} className="relative block w-full">
              <Polaroid s={s} sizes="(min-width:1024px) 440px, 1px" className="w-full" faceProps={{ "data-face": String(i) }} />
              <Pin className="absolute left-1/2 top-[3px] -translate-x-1/2" />
              {/* the marker loop drawn round whoever is under the lens */}
              <svg viewBox="0 0 100 124" className="pointer-events-none absolute -left-[16%] -top-[13%] h-[126%] w-[132%] overflow-visible" fill="none">
                <path data-loop={i} d={loopPath(i * 2.3)} pathLength={1} strokeDasharray="1" className="case-loop" />
              </svg>
            </span>
            <NameTape name={s.name} className="-mt-[0.9em] text-[calc(var(--cu)*1.45)]" />
            <span className="mt-[0.6em] text-[calc(var(--cu)*1.15)] font-bold uppercase tracking-[0.18em] text-white/70">{s.role}</span>
          </div>
        ))}
      </div>

      {/* opening titles, over the wide shot */}
      <div data-intro className="absolute inset-x-0 top-[12%] z-10 mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-10 gap-y-3 px-8">
        <h2 className="font-display text-[clamp(2.75rem,5.4vw,5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-white">
          Kaun hain ye <span className="text-gold">log?</span>
        </h2>
        <div className="max-w-sm pb-1">
          <p className="text-[1rem] leading-relaxed text-white/75">
            The paltan: the core team behind every Tripwaley trip. We pinned them to a board and followed the thread.
          </p>
          <a href="#after-paltan" className="mt-2 inline-block text-sm font-bold text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
            Skip the case file
          </a>
        </div>
      </div>

      {/* one case note per subject, swapped as the camera arrives */}
      <div className="pointer-events-none absolute right-[4vw] top-1/2 z-20 w-[min(30rem,37vw)] -translate-y-1/2">
        {subjects.map((s, i) => (
          <article key={s.id} data-note={i} className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0">
            <CaseNote s={s} index={i} total={n} hlProps={{ "data-hl": "" }} />
          </article>
        ))}
      </div>

      {/* closing titles, over the pulled-back board */}
      <div data-outro className="absolute inset-x-0 top-[12%] z-10 mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-10 gap-y-3 px-8 opacity-0">
        <p className="font-display text-[clamp(2.5rem,4.8vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-white">
          That&apos;s the <span className="text-gold">paltan.</span>
        </p>
        <div className="flex items-center gap-6 pb-1">
          <p className="max-w-[20rem] text-[1rem] leading-relaxed text-white/75">
            {people === 1 ? "One person" : `${people} people`} behind every seat you hold.
          </p>
          <Stamp data-closed="">Case closed</Stamp>
        </div>
      </div>
    </div>
  );
}
