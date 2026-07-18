"use client";

/* L07 — "Descent" (hero opener)
   You start above the weather. Scroll dives the camera down through four
   decks of drifting volumetric clouds into golden-hour light, where the
   headline is waiting on the ground. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "../lab/three/Scene3D";
import { cloudTexture, glowTexture, prng } from "../lab/three/util3d";
import { gsap } from "@/lib/gsap";

function CloudField() {
  const { progress, pointer } = useSceneRefs();
  const cloudTex = useMemo(() => cloudTexture(), []);
  const sunTex = useMemo(() => glowTexture("#ffca63"), []);
  const group = useRef<THREE.Group>(null);

  /* 4 decks of clouds, camera falls past them */
  const puffs = useMemo(() => {
    const rand = prng(7);
    return Array.from({ length: 42 }, (_, i) => {
      const deck = i % 4;
      return {
        pos: [ (rand() - 0.5) * 26, -deck * 11 - rand() * 6, -4 - rand() * 14 ] as [number, number, number],
        scale: 5 + rand() * 7,
        opacity: 0.5 + rand() * 0.35,
        drift: 0.15 + rand() * 0.3,
        phase: rand() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const cam = state.camera;
    // fall from y=6 to y=-46, easing into the landing
    const eased = 1 - Math.pow(1 - p, 1.6);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 6 - eased * 52, 2.4, delta);
    cam.position.x = THREE.MathUtils.damp(cam.position.x, (pointer.current?.x ?? 0) * 1.4, 2, delta);
    cam.lookAt(0, cam.position.y - 4, -8);
    // clouds breathe sideways
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((c, i) => {
      const d = puffs[i];
      c.position.x = d.pos[0] + Math.sin(t * d.drift + d.phase) * 1.2;
    });
  });

  return (
    <>
      <group ref={group}>
        {puffs.map((d, i) => (
          <sprite key={i} position={d.pos} scale={[d.scale, d.scale * 0.62, 1]}>
            <spriteMaterial map={cloudTex} transparent opacity={d.opacity} depthWrite={false} />
          </sprite>
        ))}
      </group>
      {/* the sun, far below the last deck */}
      <sprite position={[3, -52, -18]} scale={[26, 26, 1]}>
        <spriteMaterial map={sunTex} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

export default function L07CloudDive() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: "#lab2-l07", scrub: 0.4 };
      gsap.to("[data-l07-top]", { autoAlpha: 0, y: -40, ease: "none", scrollTrigger: { ...st, start: "12% bottom", end: "30% bottom" } });
      gsap.fromTo("[data-l07-mid]", { autoAlpha: 0 }, {
        keyframes: [{ autoAlpha: 1, duration: 0.35 }, { autoAlpha: 1, duration: 0.3 }, { autoAlpha: 0, duration: 0.35 }],
        ease: "none", scrollTrigger: { ...st, start: "30% bottom", end: "62% bottom" },
      });
      gsap.fromTo("[data-l07-end]", { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "72% bottom", end: "92% bottom" } });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="lab2-l07"
      heightVh={280}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 6, 10] }}
      backdropClassName="bg-[linear-gradient(180deg,#8fb6d9_0%,#c9d8e4_30%,#f0cfa0_70%,#e8935a_100%)]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-l07-top className="absolute inset-x-0 top-[16%] px-6 text-center">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-ink/60">cruising altitude · 36,000 ft</p>
            <h2 className="mt-4 font-display text-5xl font-extrabold tracking-tight text-ink sm:text-7xl">
              Everyone sleeps
              <br />
              through this part.
            </h2>
          </div>
          <p data-l07-mid className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center font-script text-3xl text-ink/70 opacity-0 sm:text-4xl">
            not us. window seats only.
          </p>
          <div data-l07-end className="absolute inset-x-0 bottom-[12%] px-6 text-center opacity-0">
            <h2 className="font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_18px_rgba(120,50,10,0.5)] sm:text-7xl">
              Welcome down.
            </h2>
            <a href="#" className="pointer-events-auto mt-7 inline-flex min-h-12 items-center rounded-full bg-ink px-8 py-4 font-bold text-cream transition-colors hover:bg-brand">
              Begin the descent →
            </a>
          </div>
        </div>
      }
    >
      <CloudField />
    </Scene3D>
  );
}
