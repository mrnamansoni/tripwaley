"use client";

/* Shared craft utilities for the Lab 2 motion library.
   One entrance grammar across all 50 pieces keeps the page coherent. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** Standard entrance: lifts every [data-in] descendant when the section enters. */
export function useEntrance<T extends HTMLElement>(start = "top 64%") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = ref.current?.querySelectorAll("[data-in]");
      if (!els?.length) return;
      gsap.fromTo(
        els,
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: 1.05, ease: "power3.out", stagger: 0.11, scrollTrigger: { trigger: ref.current, start } }
      );
    }, ref);
    return () => ctx.revert();
  }, [start]);
  return ref;
}

export function Eyebrow({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "gold" | "light" }) {
  const color = tone === "gold" ? "text-gold" : tone === "light" ? "text-white/60" : "text-brand";
  return (
    <p data-in className={`text-[0.62rem] font-bold uppercase tracking-[0.45em] ${color}`}>
      {children}
    </p>
  );
}

/** lat/lon (degrees) → position on a sphere of radius r */
export function latLon(lat: number, lon: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}
