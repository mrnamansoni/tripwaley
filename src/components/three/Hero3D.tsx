"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * Lazy 3D loader:
 *  - waits for first paint + idle time before downloading three.js
 *  - skips entirely on reduced-motion or missing WebGL (static backdrop stays)
 *  - reports visibility so the scene can pause its render loop off-screen
 */
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Hero3D() {
  const holderRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!webglSupported()) return;
    const raf = requestAnimationFrame(() => setEnabled(true));

    // defer the three.js chunk until the main thread is idle post-first-paint
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
    } else {
      timeoutId = setTimeout(() => setReady(true), 700);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={holderRef}
      aria-hidden="true"
      className={`absolute inset-0 transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      {ready && <HeroScene active={visible} />}
    </div>
  );
}
