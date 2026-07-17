"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface RouteDrawProps {
  /** SVG path `d` for the route */
  d: string;
  viewBox: string;
  className?: string;
  /** stroke width of the dotted route */
  strokeWidth?: number;
  /** [start, end] ScrollTrigger positions */
  start?: string;
  end?: string;
  /** Optional pin markers rendered at given coords, popping in as the line passes */
  markers?: { x: number; y: number }[];
}

/**
 * Dotted red travel-route that draws itself on scroll.
 *
 * Trick: a dotted line can't be drawn with dashoffset directly (the dots would
 * slide instead of revealing). So the visible dotted path sits under an SVG
 * <mask> that contains a solid copy of the same path; the *mask* path animates
 * stroke-dashoffset → the dots appear progressively while staying in place.
 */
export default function RouteDraw({
  d,
  viewBox,
  className,
  strokeWidth = 3,
  start = "top 80%",
  end = "bottom 45%",
  markers = [],
}: RouteDrawProps) {
  const maskId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const markersRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const maskPath = maskPathRef.current;
    const svg = svgRef.current;
    if (!maskPath || !svg) return;

    const len = maskPath.getTotalLength();
    gsap.set(maskPath, { strokeDasharray: len, strokeDashoffset: len });

    const ctx = gsap.context(() => {
      gsap.to(maskPath, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: svg, start, end, scrub: 0.6 },
      });
      // Markers pop in staggered across the same scroll window
      if (markersRef.current) {
        gsap.fromTo(
          markersRef.current.children,
          { scale: 0, transformOrigin: "center", opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: "back.out(2.5)",
            stagger: 0.15,
            scrollTrigger: { trigger: svg, start, end, scrub: 0.6 },
          }
        );
      }
    }, svg);

    return () => ctx.revert();
  }, [start, end]);

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path
            ref={maskPathRef}
            d={d}
            stroke="#fff"
            strokeWidth={strokeWidth * 3}
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <path
        d={d}
        stroke="var(--color-brand)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`0.1 ${strokeWidth * 3}`}
        mask={`url(#${maskId})`}
      />
      <g ref={markersRef}>
        {markers.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={strokeWidth * 2.2} fill="var(--color-brand)" opacity="0.15" />
            <circle cx={m.x} cy={m.y} r={strokeWidth * 1.1} fill="var(--color-brand)" />
          </g>
        ))}
      </g>
    </svg>
  );
}
