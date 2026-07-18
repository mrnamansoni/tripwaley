"use client";

 

/* HERO 11 — "The Memory Tunnel"
   Scroll flies the camera down an endless corridor of floating trip photos,
   drifting past like memories. Cursor sways the flight path. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { prng } from "./three/util3d";

const IMGS = [
  "/images/ladakh.jpg", "/images/kerala.jpg", "/images/spiti.jpg",
  "/images/andaman.jpg", "/images/rajasthan.jpg", "/images/kashmir.jpg",
  "/images/stars.jpg", "/images/meghalaya.jpg",
];
const COUNT = 26;
const DEPTH = 95;

function Tunnel() {
  const { progress, pointer } = useSceneRefs();
  const textures = useLoader(THREE.TextureLoader, IMGS);
  const cam = useRef<THREE.Group>(null);

  const slots = useMemo(() => {
    const rand = prng(777);
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const radius = 3.4 + rand() * 2.4;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.62,
        z: -6 - (i / COUNT) * DEPTH + rand() * 2,
        rot: (rand() - 0.5) * 0.5,
        tex: i % IMGS.length,
        w: 3.1 + rand() * 1.2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    const c = state.camera;
    c.position.z = THREE.MathUtils.damp(c.position.z, 6 - p * (DEPTH + 4), 3, delta);
    c.position.x = THREE.MathUtils.damp(c.position.x, px * 1.3, 2, delta);
    c.position.y = THREE.MathUtils.damp(c.position.y, py * 0.9, 2, delta);
    c.lookAt(px * 0.6, py * 0.4, c.position.z - 10);
  });

  return (
    <group ref={cam}>
      <fog attach="fog" args={["#fffcf8", 6, 34]} />
      <ambientLight intensity={2.1} />
      {slots.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, 0, s.rot]}>
          <planeGeometry args={[s.w, s.w * 0.72]} />
          <meshBasicMaterial map={textures[s.tex]} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
      {/* red waypoint dashes running down the tunnel core */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={`d${i}`} position={[0, -2.6, -i * 3.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 1.1]} />
          <meshBasicMaterial color="#c91b20" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero11PhotoTunnel() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: "#hero-sec-11", scrub: 0.4 };
      gsap.to("[data-t11-intro]", {
        autoAlpha: 0, scale: 0.94, ease: "none",
        scrollTrigger: { ...st, start: "top top", end: "22% bottom" },
      });
      gsap.fromTo("[data-t11-mid]", { autoAlpha: 0 }, {
        autoAlpha: 1, ease: "none", keyframes: [{ autoAlpha: 1, duration: 0.5 }, { autoAlpha: 0, duration: 0.5 }],
        scrollTrigger: { ...st, start: "35% bottom", end: "72% bottom" },
      });
      gsap.fromTo("[data-t11-end]", { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { ...st, start: "80% bottom", end: "96% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-11"
      heightVh={300}
      camera={{ fov: 60, near: 0.1, far: 60, position: [0, 0, 6] }}
      backdropClassName="bg-cream"
      overlay={
        <div ref={overlayRef} className="absolute inset-0">
          <div data-t11-intro className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-script text-2xl text-brand sm:text-3xl">12,000 camera rolls deep</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight sm:text-8xl">
              The memory
              <br />
              <span className="text-brand">tunnel.</span>
            </h1>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-ink/45">scroll to fly through</p>
          </div>
          <div data-t11-mid className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center opacity-0">
            <p className="max-w-xl font-display text-3xl font-extrabold text-ink/85 sm:text-5xl">
              every frame here was shot
              <br />
              by a <span className="text-brand">stranger-turned-family</span>
            </p>
          </div>
          <div data-t11-end className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
            <p className="font-script text-3xl text-brand">your turn now</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold sm:text-6xl">Add yours to the tunnel.</h2>
            <a href="#" className="pointer-events-auto mt-7 rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Book a departure →
            </a>
          </div>
        </div>
      }
    >
      <Tunnel />
    </Scene3D>
  );
}
