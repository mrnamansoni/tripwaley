"use client";

/* Scene3D — the lab's pinned-3D-section engine.
   Gives every hero: a tall pinned section, a WebGL canvas that mounts only
   when approaching the viewport (and unmounts when far away, so ten heroes
   can share one page without exhausting GL contexts), a paused render loop
   off-screen, and refs with live scroll progress + pointer position that
   scenes read every frame. */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { ScrollTrigger } from "@/lib/gsap";

THREE.Cache.enabled = true; // share decoded textures across scenes

export interface SceneRefs {
  /** pinned scroll progress 0..1 */
  progress: React.RefObject<number>;
  /** normalized pointer, -1..1, y up */
  pointer: React.RefObject<{ x: number; y: number }>;
}

const Ctx = createContext<SceneRefs | null>(null);
export function useSceneRefs(): SceneRefs {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSceneRefs must be used inside <Scene3D>");
  return v;
}

interface Scene3DProps {
  id: string;
  /** total section height in vh (pin length) */
  heightVh?: number;
  camera?: CanvasProps["camera"];
  /** DOM layered over the canvas (headlines, CTAs, HUD) */
  overlay?: ReactNode;
  /** painted background behind the (alpha) canvas */
  backdropClassName?: string;
  children: ReactNode;
}

export default function Scene3D({
  id,
  heightVh = 250,
  camera,
  overlay,
  backdropClassName = "bg-cream",
  children,
}: Scene3DProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // near: mount + run. mid: keep but pause. far: unmount (frees GL context).
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMounted(true);
        setActive(e.isIntersecting);
      },
      { rootMargin: "600px" }
    );
    near.observe(el);
    const far = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) setMounted(false);
      },
      { rootMargin: "2200px" }
    );
    far.observe(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      near.disconnect();
      far.disconnect();
      st.kill();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={sectionRef} id={id} className="relative" style={{ height: `${heightVh}vh` }}>
      <div className={`sticky top-0 h-screen overflow-hidden ${backdropClassName}`}>
        {mounted && (
          <div className="absolute inset-0" aria-hidden="true">
            <Canvas
              frameloop={active ? "always" : "never"}
              dpr={[1, 1.6]}
              camera={camera}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              style={{ pointerEvents: "none" }}
            >
              <Ctx.Provider value={{ progress, pointer }}>{children}</Ctx.Provider>
            </Canvas>
          </div>
        )}
        {overlay}
      </div>
    </section>
  );
}
