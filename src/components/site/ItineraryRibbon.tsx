"use client";

/* THE ROAD — package itinerary, day by day.
 *
 * The day cards sit either side of a winding mountain road that is generated
 * to pass exactly through every day marker, and a bus drives down it as you
 * scroll. The road is rebuilt from real measured node positions (not a fixed
 * curve), so it stays glued to the markers no matter how tall the cards grow
 * once their full text is shown.
 *
 * Performance notes:
 *  • the path is regenerated only on resize, never on scroll
 *  • the scroll handler writes one transform on the bus and one dashoffset on
 *    the travelled road — no layout reads, no React state per frame
 *  • under prefers-reduced-motion the road is drawn complete and the bus parks
 */

import { useCallback, useEffect, useRef } from "react";
import SiteMedia from "./SiteMedia";
import RichText from "./RichText";
import DayChips from "./DayChips";
import { gsap } from "@/lib/gsap";
import type { ItineraryDay } from "@/lib/types";

export default function ItineraryRibbon({
  days,
  images,
  header,
  dayCollapse,
}: {
  days: ItineraryDay[];
  images: string[];
  /** tighter day preview for the creator pages, where the same route sits
   *  under a creator's framing and a 9-line card makes the page endless */
  dayCollapse?: { over: number; height: string };
  /** replaces the centred title block — the creator pages front their own
   *  framing ("Naman walks you through…") above the same road. */
  header?: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const laneRef = useRef<SVGPathElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const busRef = useRef<HTMLDivElement>(null);
  const lenRef = useRef(0);

  /** Build a road that threads through every day marker.
   *  Markers are measured live, so variable-height cards can't desync it. */
  const buildRoad = useCallback(() => {
    const rail = railRef.current;
    const svg = svgRef.current;
    if (!rail || !svg || !roadRef.current || !laneRef.current || !doneRef.current) return;

    const rect = rail.getBoundingClientRect();
    const w = rect.width;
    const h = rail.offsetHeight;
    if (!w || !h) return;

    const nodes = Array.from(rail.querySelectorAll<HTMLElement>("[data-ir-node]"));
    if (!nodes.length) return;

    const mobile = w < 640;
    // desktop: road runs down the middle. mobile: down the left gutter.
    const cx = mobile ? 28 : w / 2;
    const amp = mobile ? Math.min(18, w * 0.05) : Math.min(160, w * 0.18);

    // Measure against the rail, NOT offsetTop: each marker is absolutely
    // positioned inside its own relative day row, so offsetTop would report
    // the same tiny offset for every one of them and flatten the road.
    const ys = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return r.top - rect.top + r.height / 2;
    });

    // lead-in above the first marker, run-out below the last
    let d = `M ${cx} 0`;
    d += ` L ${cx} ${Math.max(0, ys[0])}`;
    for (let i = 1; i < ys.length; i++) {
      const dir = i % 2 ? 1 : -1;
      const y0 = ys[i - 1];
      const y1 = ys[i];
      const bulge = cx + amp * dir;
      d += ` C ${bulge} ${y0 + (y1 - y0) * 0.34}, ${bulge} ${y1 - (y1 - y0) * 0.34}, ${cx} ${y1}`;
    }
    d += ` L ${cx} ${h}`;

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", `${w}`);
    svg.setAttribute("height", `${h}`);
    for (const p of [roadRef.current, laneRef.current, doneRef.current]) p.setAttribute("d", d);

    const len = roadRef.current.getTotalLength();
    lenRef.current = len;
    // the travelled overlay is revealed by shrinking its dash offset
    doneRef.current.style.strokeDasharray = `${len}`;
    doneRef.current.style.strokeDashoffset = `${len}`;
  }, []);

  /** place the bus at 0..1 along the road, rotated to the tangent */
  const placeBus = useCallback((t: number) => {
    const road = roadRef.current;
    const bus = busRef.current;
    const done = doneRef.current;
    const len = lenRef.current;
    if (!road || !bus || !done || !len) return;

    const at = Math.max(0, Math.min(1, t)) * len;
    const p = road.getPointAtLength(at);
    // tangent from a nearby sample — atan2 gives the heading to rotate into
    const q = road.getPointAtLength(Math.min(len, at + 2));
    const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI - 90;

    bus.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
    done.style.strokeDashoffset = `${len - at}`;
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    buildRoad();

    // cards grow when their text expands, and images settle after decode —
    // both change marker positions, so watch the rail rather than the window
    const ro = new ResizeObserver(() => {
      buildRoad();
      if (reduced.matches) placeBus(1);
    });
    if (railRef.current) ro.observe(railRef.current);

    if (reduced.matches) {
      // No reveal tweens will run, so the cards must be shown outright —
      // they ship with opacity-0 for the animated path and would otherwise
      // stay invisible for anyone who prefers reduced motion.
      for (const el of document.querySelectorAll<HTMLElement>("[data-ir-card]")) {
        el.style.opacity = "1";
        el.style.visibility = "visible";
      }
      placeBus(1);
      return () => ro.disconnect();
    }

    const ctx = gsap.context(() => {
      gsap.to({}, {
        ease: "none",
        scrollTrigger: {
          trigger: railRef.current,
          start: "top 62%",
          end: "bottom 78%",
          scrub: 0.35,
          onUpdate: (self) => placeBus(self.progress),
          onRefresh: () => buildRoad(),
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-ir-card]").forEach((card, i) => {
        gsap.fromTo(card,
          { autoAlpha: 0, x: i % 2 === 0 ? -46 : 46, rotate: i % 2 === 0 ? -1.2 : 1.2 },
          { autoAlpha: 1, x: 0, rotate: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 80%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-ir-node]").forEach((node) => {
        gsap.fromTo(node, { scale: 0 },
          { scale: 1, duration: 0.45, ease: "back.out(2.4)",
            scrollTrigger: { trigger: node, start: "top 76%" } });
      });
    }, rootRef);

    return () => { ctx.revert(); ro.disconnect(); };
  }, [buildRoad, placeBus]);

  return (
    <section ref={rootRef} className="overflow-hidden bg-cream py-[10vh]">
      {header ?? (
        <div className="mx-auto max-w-2xl px-5 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-brand">the route · day by day</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Read it like a <span className="text-brand">boarding call.</span>
          </h2>
        </div>
      )}

      <div ref={railRef} className="relative mx-auto mt-14 w-full max-w-5xl px-5 pb-10 sm:px-8">
        {/* the road */}
        <svg
          ref={svgRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
        >
          {/* asphalt */}
          <path ref={roadRef} fill="none" stroke="#241f1c" strokeWidth="26" strokeLinecap="round" opacity="0.13" />
          {/* dashed centre line, drawn only on the stretch already travelled */}
          <path
            ref={laneRef}
            fill="none"
            stroke="#241f1c"
            strokeWidth="2"
            strokeDasharray="14 16"
            strokeLinecap="round"
            opacity="0.18"
          />
          <path
            ref={doneRef}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 2px 6px rgba(245,163,26,0.45))" }}
          />
        </svg>

        {/* the bus riding the road */}
        <div
          ref={busRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 will-change-transform"
          style={{ transform: "translate(-100px, -100px)" }}
        >
          <Bus />
        </div>

        <div className="relative space-y-14">
          {days.map((day, i) => (
            <div key={`${day.day}-${i}`} className={`relative flex pl-16 sm:pl-0 ${i % 2 === 0 ? "sm:justify-start" : "sm:justify-end"}`}>
              <span
                data-ir-node
                className="absolute left-7 top-8 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-cream bg-brand font-display text-[0.66rem] font-extrabold text-white shadow-red sm:left-1/2"
              >
                D{day.day}
              </span>

              <article
                data-ir-card
                className="group relative w-full overflow-hidden rounded-3xl border border-line bg-card opacity-0 shadow-card-lg transition-shadow duration-500 hover:border-gold/60 hover:shadow-[0_24px_60px_rgba(201,37,44,0.16)] sm:w-[calc(50%-3.4rem)]"
              >
                <div className="relative h-44 overflow-hidden">
                  {/* the admin's per-day photo (or video) leads; the package
                      gallery is only the fallback when a day has none */}
                  <SiteMedia
                    src={day.image || images[i % images.length]}
                    alt=""
                    fill
                    sizes="(max-width:640px) 90vw, 32rem"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden="true" />
                  <span aria-hidden="true" className="absolute -right-2 -top-5 font-display text-[5.2rem] font-extrabold leading-none text-white/25 transition-colors duration-500 group-hover:text-gold/50">
                    {String(day.day).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-3 left-4 rounded-full bg-gold px-3 py-1 text-[0.58rem] font-extrabold uppercase tracking-widest text-ink">
                    Day {String(day.day).padStart(2, "0")}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="font-display text-lg font-extrabold leading-snug text-ink transition-colors group-hover:text-brand">
                    {day.title}
                  </h3>
                  <DayChips meals={day.meals} stay={day.stay} tone="light" className="mt-2.5" />
                  {/* full day text — expandable, never cut */}
                  {day.body && (
                    <RichText
                      text={day.body}
                      collapseOver={dayCollapse?.over ?? 260}
                      collapsedHeight={dayCollapse?.height ?? "16rem"}
                      className="mt-1.5"
                      moreLabel="Read the full day"
                      lessLabel="Show less"
                    />
                  )}
                </div>

                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Side-on coach, nose pointing up the road (the wrapper rotates it to the
   tangent). Brand red body, gold windows, tiny warm headlight. */
function Bus() {
  return (
    <svg width="38" height="54" viewBox="0 0 38 54" fill="none">
      <ellipse cx="19" cy="49" rx="13" ry="4" fill="#1a1614" opacity="0.18" />
      <rect x="4" y="3" width="30" height="44" rx="9" fill="var(--color-brand)" />
      <rect x="4" y="3" width="30" height="44" rx="9" stroke="#8f1216" strokeWidth="1.5" />
      {/* windscreen */}
      <path d="M8 11c3-3.4 19-3.4 22 0v6H8v-6Z" fill="var(--color-gold)" opacity="0.95" />
      {/* side windows */}
      <rect x="8" y="21" width="8" height="7" rx="2" fill="#ffd98a" opacity="0.85" />
      <rect x="22" y="21" width="8" height="7" rx="2" fill="#ffd98a" opacity="0.85" />
      <rect x="8" y="31" width="8" height="7" rx="2" fill="#ffd98a" opacity="0.7" />
      <rect x="22" y="31" width="8" height="7" rx="2" fill="#ffd98a" opacity="0.7" />
      {/* headlights */}
      <circle cx="11" cy="7" r="2.1" fill="#fff6e0" />
      <circle cx="27" cy="7" r="2.1" fill="#fff6e0" />
      {/* wheels */}
      <rect x="1.5" y="14" width="4" height="9" rx="2" fill="#1a1614" />
      <rect x="32.5" y="14" width="4" height="9" rx="2" fill="#1a1614" />
      <rect x="1.5" y="32" width="4" height="9" rx="2" fill="#1a1614" />
      <rect x="32.5" y="32" width="4" height="9" rx="2" fill="#1a1614" />
    </svg>
  );
}
