"use client";

 

/* HERO 19 — "Window Seat"
   The most Indian of all travel feelings: forehead on the train window.
   Scroll drives the train — layered 3D scenery streams past with true
   depth parallax, chai in hand, day slipping by. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { fbm, prng } from "./three/util3d";

const TRACK = 240; // world units of journey

function Scenery() {
  const { progress, pointer } = useSceneRefs();
  const world = useRef<THREE.Group>(null);
  const poles = useRef<THREE.Group>(null);

  /* rolling hills backdrop (two depth bands) */
  const hills = useMemo(() => {
    const make = (amp: number, seedOff: number, w: number) => {
      const geo = new THREE.PlaneGeometry(w, 16, 160, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0) pos.setY(i, 2 + fbm(pos.getX(i) * 0.03 + seedOff, 1) * amp);
      }
      return geo;
    };
    return [make(9, 4, TRACK * 2), make(5, 11, TRACK * 2)];
  }, []);

  const trees = useMemo(() => {
    const rand = prng(555);
    return Array.from({ length: 90 }, () => ({
      x: rand() * TRACK * 2 - TRACK,
      z: -6 - rand() * 10,
      s: 0.7 + rand() * 1.1,
    }));
  }, []);

  useEffect(() => () => hills.forEach((h) => h.dispose()), [hills]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const py = pointer.current?.y ?? 0;
    const dist = p * TRACK;
    if (world.current) {
      // scenery streams right-to-left as the train moves
      world.current.position.x = THREE.MathUtils.damp(world.current.position.x, -dist, 3, delta);
    }
    if (poles.current) {
      poles.current.position.x = THREE.MathUtils.damp(poles.current.position.x, -dist * 1.6, 3, delta);
    }
    const c = state.camera;
    c.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 3.1) * 0.02 + py * 0.15; // gentle carriage sway
    c.lookAt(0, 1.6, -10);
  });

  return (
    <>
      <fog attach="fog" args={["#fdf1e9", 18, 60]} />
      <ambientLight intensity={1.3} color="#fff3e2" />
      <directionalLight position={[4, 10, 6]} intensity={1.4} color="#ffd9a0" />

      <group ref={world}>
        {/* far + mid hill bands */}
        <mesh geometry={hills[0]} position={[TRACK / 2, 0, -34]}>
          <meshBasicMaterial color="#e0b28c" />
        </mesh>
        <mesh geometry={hills[1]} position={[TRACK / 2, 0, -22]}>
          <meshBasicMaterial color="#c98f66" />
        </mesh>
        {/* ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK / 2, 0, -8]}>
          <planeGeometry args={[TRACK * 2.4, 26]} />
          <meshStandardMaterial color="#9cb56f" roughness={1} />
        </mesh>
        {/* trees at varying depths */}
        {trees.map((t, i) => (
          <group key={i} position={[t.x + TRACK / 2, 0, t.z]} scale={t.s}>
            <mesh position={[0, 1.1, 0]}>
              <coneGeometry args={[0.55, 1.7, 6]} />
              <meshStandardMaterial color="#3e7c4f" flatShading roughness={1} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.09, 0.13, 0.5, 5]} />
              <meshStandardMaterial color="#7a5236" flatShading roughness={1} />
            </mesh>
          </group>
        ))}
        {/* the gold sun hanging over the fields */}
        <mesh position={[TRACK * 0.62, 8.5, -40]}>
          <circleGeometry args={[3, 40]} />
          <meshBasicMaterial color="#f5a31a" />
        </mesh>
      </group>

      {/* near telegraph poles whipping past (fast parallax layer) */}
      <group ref={poles}>
        {Array.from({ length: 40 }).map((_, i) => (
          <group key={i} position={[i * 10, 0, -3.4]}>
            <mesh position={[0, 2.1, 0]}>
              <boxGeometry args={[0.14, 4.2, 0.14]} />
              <meshStandardMaterial color="#5c4632" roughness={1} />
            </mesh>
            <mesh position={[0, 3.7, 0]}>
              <boxGeometry args={[1.15, 0.1, 0.1]} />
              <meshStandardMaterial color="#5c4632" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

export default function Hero19TrainWindow() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { v: 0 };
      gsap.to(st, {
        v: 1, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-19", scrub: true, start: "top top", end: "bottom bottom" },
        onUpdate: () => {
          if (kmRef.current) kmRef.current.textContent = Math.round(st.v * 412).toString();
        },
      });
      gsap.fromTo("[data-tr19-end]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-19", scrub: 0.4, start: "78% bottom", end: "94% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-19"
      heightVh={300}
      camera={{ fov: 55, near: 0.1, far: 80, position: [0, 1.6, 4] }}
      backdropClassName="bg-gradient-to-b from-[#fbe3d2] to-cream"
      overlay={
        <div ref={overlayRef} className="absolute inset-0">
          {/* window mullions — you're inside the carriage */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[7vh] bg-ink" />
            <div className="absolute inset-x-0 bottom-0 h-[13vh] bg-ink" />
            <div className="absolute inset-y-0 left-0 w-[4vw] bg-ink" />
            <div className="absolute inset-y-0 right-0 w-[4vw] bg-ink" />
            <div className="absolute inset-y-0 left-1/2 w-[2.2vw] -translate-x-1/2 bg-ink" />
            {/* rounded window corners */}
            <div className="absolute inset-x-[4vw] inset-y-[7vh] bottom-[13vh] rounded-[2rem] shadow-[inset_0_0_60px_rgba(26,22,20,0.35)]" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[10vh] px-[7vw]">
            <p className="font-script text-2xl text-brand sm:text-3xl">seat 42, window</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              The best screen
              <br />
              in <span className="text-brand">India.</span>
            </h1>
          </div>

          {/* journey ticker */}
          <div className="absolute bottom-[3.5vh] left-[4vw] right-[4vw] flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.25em] text-cream/70">
            <span>TW EXPRESS · DEL → LEH</span>
            <span>
              km <span ref={kmRef} className="text-gold tabular-nums">0</span> / 412
            </span>
          </div>

          <div data-tr19-end className="absolute inset-x-0 bottom-[18vh] px-6 text-center opacity-0">
            <a href="#" className="pointer-events-auto inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Chai + window seat — book it →
            </a>
          </div>
        </div>
      }
    >
      <Scenery />
    </Scene3D>
  );
}
