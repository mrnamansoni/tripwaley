"use client";

 

/* HERO 20 — "Written in the Stars"
   A night camp under a real star dome. Scroll tilts your gaze from the
   campfire up into the sky, where stars connect themselves into next
   season's trek route — an itinerary drawn in constellations. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { prng, glowTexture, win } from "./three/util3d";

/* the "route" constellation — a trek profile drawn in the sky */
const ROUTE_STARS: [number, number, number][] = [
  [-16, 12, -30], [-10, 15, -32], [-5, 13.5, -31], [0, 18, -33],
  [5, 15.5, -31], [10, 20, -34], [15, 17, -32],
];

function NightCamp() {
  const { progress, pointer } = useSceneRefs();
  const fire = useRef<THREE.PointLight>(null);
  const fireGlow = useRef<THREE.Sprite>(null);
  const routeLine = useRef<THREE.Line>(null);
  const glowGold = useMemo(() => glowTexture("rgb(245,163,26)"), []);
  const glowWhite = useMemo(() => glowTexture("rgb(255,255,255)"), []);

  const stars = useMemo(() => {
    const rand = prng(2020);
    const n = 900;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // dome distribution
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI * 0.48;
      const r = 55;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.75 + 2;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const route = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      ROUTE_STARS.map((s) => new THREE.Vector3(...s))
    );
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#f5a31a", transparent: true, opacity: 0.85 }));
    line.geometry.setDrawRange(0, 0);
    return line;
  }, []);

  useEffect(() => () => {
    stars.dispose();
    route.geometry.dispose();
    (route.material as THREE.Material).dispose();
    glowGold.dispose();
    glowWhite.dispose();
  }, [stars, route, glowGold, glowWhite]);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const e = state.clock.elapsedTime;

    // gaze: campfire → sky
    const pitch = win(p, 0.1, 0.55); // 0 looking at camp, 1 looking up
    const c = state.camera;
    c.position.set(px * 0.8, 1.6, 8);
    const lookY = 1.2 + pitch * 22;
    const lookZ = -6 - pitch * 18;
    c.lookAt(px * 2, lookY, lookZ);

    // constellation draws in the final act
    const drawn = Math.floor(win(p, 0.58, 0.85) * (ROUTE_STARS.length + 1));
    route.geometry.setDrawRange(0, drawn);

    // fire flicker
    if (fire.current) fire.current.intensity = 14 + Math.sin(e * 9) * 3 + Math.sin(e * 23) * 2;
    if (fireGlow.current) {
      const s = 3.4 + Math.sin(e * 7) * 0.3;
      fireGlow.current.scale.set(s, s, 1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} color="#8a9bc4" />
      <pointLight ref={fire} position={[0, 0.7, -4]} color="#ff9a3d" distance={18} decay={2} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[70, 40]} />
        <meshStandardMaterial color="#171a22" roughness={1} />
      </mesh>

      {/* tents */}
      {[[-4.5, -5.5, 0.5], [4.2, -6, -0.4], [-1.5, -8.5, 0.2]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.5, 1.7, 4]} />
            <meshStandardMaterial color={i === 1 ? "#c91b20" : "#f5a31a"} flatShading roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* campfire glow */}
      <sprite ref={fireGlow} position={[0, 0.9, -4]} scale={[3.4, 3.4, 1]}>
        <spriteMaterial map={glowGold} transparent opacity={0.9} depthWrite={false} />
      </sprite>

      {/* star dome */}
      <points geometry={stars}>
        <pointsMaterial color="#dfe6ff" size={0.55} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
      </points>

      {/* milky way band */}
      <sprite position={[4, 22, -34]} scale={[46, 13, 1]} material-rotation={-0.5}>
        <spriteMaterial map={glowWhite} transparent opacity={0.24} depthWrite={false} />
      </sprite>

      {/* the route constellation */}
      <primitive object={route} ref={routeLine} />
      {ROUTE_STARS.map((s, i) => (
        <sprite key={i} position={s} scale={[2.8, 2.8, 1]}>
          <spriteMaterial map={glowGold} transparent opacity={0.95} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

export default function Hero20Constellation() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to("[data-c20-a]", {
        autoAlpha: 0, y: -24, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-20", scrub: 0.4, start: "16% bottom", end: "34% bottom" },
      });
      gsap.fromTo("[data-c20-b]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-20", scrub: 0.4, start: "72% bottom", end: "92% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-20"
      heightVh={300}
      camera={{ fov: 52, near: 0.1, far: 120, position: [0, 1.6, 8] }}
      backdropClassName="bg-gradient-to-b from-[#0b0e18] via-[#131629] to-[#1d1428]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-c20-a className="absolute inset-x-0 top-[10%] px-6 text-center">
            <p className="font-script text-2xl text-gold sm:text-3xl">last one. our favourite.</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white sm:text-8xl">
              Written in
              <br />
              the <span className="text-gold">stars.</span>
            </h1>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/40">scroll — look up from the fire</p>
          </div>
          <div data-c20-b className="absolute inset-x-0 bottom-[10%] px-6 text-center opacity-0">
            <p className="font-script text-2xl text-gold sm:text-3xl">that&apos;s the Kedarkantha route, by the way</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-5xl">
              We plan around meteor showers.
              <br />
              Yes, really.
            </h2>
            <a href="#" className="pointer-events-auto mt-6 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Camp under this sky →
            </a>
          </div>
        </div>
      }
    >
      <NightCamp />
    </Scene3D>
  );
}
