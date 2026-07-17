"use client";

 

/* HERO 16 — "The Drop"
   A vertical descent past three floating low-poly islands — snow, jungle,
   beach — each one an India you can book. Scroll is the elevator. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { fbm, prng, cloudTexture } from "./three/util3d";

interface IslandSpec {
  y: number;
  top: string;
  cliff: string;
  accent: string;
  trees: boolean;
}

const ISLANDS: IslandSpec[] = [
  { y: 0, top: "#ffffff", cliff: "#b97053", accent: "#dfe9f5", trees: true }, // snow
  { y: -16, top: "#6a9e55", cliff: "#8a5236", accent: "#3e7c4f", trees: true }, // jungle
  { y: -32, top: "#f0dfa8", cliff: "#c99668", accent: "#5fb7d9", trees: false }, // beach
];

function Island({ spec, seed }: { spec: IslandSpec; seed: number }) {
  const group = useRef<THREE.Group>(null);

  const topGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(4.2, 4.5, 1.2, 9, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.5) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, 0.6 + fbm(x * 0.4 + seed, z * 0.4) * 1.6);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed]);

  const trees = useMemo(() => {
    const rand = prng(seed * 13 + 5);
    return Array.from({ length: spec.trees ? 9 : 0 }, () => ({
      x: (rand() - 0.5) * 6,
      z: (rand() - 0.5) * 6,
      s: 0.5 + rand() * 0.5,
    }));
  }, [seed, spec.trees]);

  useEffect(() => () => topGeo.dispose(), [topGeo]);

  useFrame((state) => {
    if (!group.current) return;
    const e = state.clock.elapsedTime;
    group.current.position.y = spec.y + Math.sin(e * 0.4 + seed) * 0.35;
    group.current.rotation.y = Math.sin(e * 0.1 + seed) * 0.08;
  });

  return (
    <group ref={group} position={[0, spec.y, 0]}>
      <mesh geometry={topGeo}>
        <meshStandardMaterial color={spec.top} flatShading roughness={1} />
      </mesh>
      {/* rocky underbelly */}
      <mesh position={[0, -2.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[4.4, 4.6, 9]} />
        <meshStandardMaterial color={spec.cliff} flatShading roughness={1} />
      </mesh>
      {/* accent skirt (water/ice/foliage ring) */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[4.55, 4.55, 0.22, 9]} />
        <meshStandardMaterial color={spec.accent} flatShading roughness={0.6} />
      </mesh>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 1.3, t.z]} scale={t.s}>
          <mesh position={[0, 0.7, 0]}>
            <coneGeometry args={[0.5, 1.4, 6]} />
            <meshStandardMaterial color="#3e7c4f" flatShading roughness={1} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.4, 5]} />
            <meshStandardMaterial color="#7a5236" flatShading roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Drop() {
  const { progress, pointer } = useSceneRefs();
  const clouds = useMemo(() => cloudTexture(), []);
  useEffect(() => () => clouds.dispose(), [clouds]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    const c = state.camera;
    c.position.y = THREE.MathUtils.damp(c.position.y, 2 - p * 36, 2.8, delta);
    c.position.x = THREE.MathUtils.damp(c.position.x, 9 + px * 1.4, 2, delta);
    c.position.z = THREE.MathUtils.damp(c.position.z, 11, 2, delta);
    c.lookAt(0, c.position.y - 2 + py * 1.2, 0);
  });

  return (
    <>
      <fog attach="fog" args={["#fef5f0", 14, 42]} />
      <ambientLight intensity={1.2} color="#fff3e2" />
      <directionalLight position={[8, 10, 6]} intensity={1.5} color="#ffd9a0" />
      {ISLANDS.map((spec, i) => (
        <Island key={i} spec={spec} seed={i * 7 + 2} />
      ))}
      {/* cloud puffs drifting between the islands */}
      {[[-6, -7, -3], [7, -9, 2], [-5, -23, 3], [6, -25, -4], [0, -38, 0]].map(([x, y, z], i) => (
        <sprite key={i} position={[x, y, z]} scale={[7, 3.5, 1]}>
          <spriteMaterial map={clouds} transparent opacity={0.75} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

const BEATS = [
  { sel: "a", title: "Winter you.", sub: "Kedarkantha summit · −6°C · hot maggi included", win: [0.02, 0.26] },
  { sel: "b", title: "Monsoon you.", sub: "Meghalaya root bridges · 100% humidity, 200% alive", win: [0.36, 0.6] },
  { sel: "c", title: "Island you.", sub: "Andaman blues · SPF 50 mandatory", win: [0.68, 0.92] },
];

export default function Hero16FloatingIslands() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      BEATS.forEach((b) => {
        gsap.fromTo(`[data-i16-${b.sel}]`, { autoAlpha: 0, y: 34 }, {
          autoAlpha: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: "#hero-sec-16", scrub: 0.4, start: `${b.win[0] * 100}% bottom`, end: `${(b.win[0] + 0.08) * 100}% bottom` },
        });
        gsap.to(`[data-i16-${b.sel}]`, {
          autoAlpha: 0, y: -26, ease: "none",
          scrollTrigger: { trigger: "#hero-sec-16", scrub: 0.4, start: `${b.win[1] * 100}% bottom`, end: `${(b.win[1] + 0.07) * 100}% bottom` },
        });
      });
      gsap.fromTo("[data-i16-end]", { autoAlpha: 0 }, {
        autoAlpha: 1, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-16", scrub: 0.4, start: "93% bottom", end: "99% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-16"
      heightVh={320}
      camera={{ fov: 46, near: 0.1, far: 70, position: [9, 2, 11] }}
      backdropClassName="bg-gradient-to-b from-cream via-blush to-[#fbe3d2]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <p className="absolute inset-x-0 top-[8%] text-center font-script text-2xl text-brand sm:text-3xl">
            how many yous are waiting down there?
          </p>
          {BEATS.map((b) => (
            <div key={b.sel} data-i16={b.sel} {...{ [`data-i16-${b.sel}`]: true }} className="absolute left-[7%] top-[38%] max-w-xs opacity-0 sm:left-[10%]">
              <h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{b.title}</h2>
              <p className="mt-2 text-sm font-semibold text-ink/60">{b.sub}</p>
            </div>
          ))}
          <div data-i16-end className="absolute inset-x-0 bottom-[10%] px-6 text-center opacity-0">
            <a href="#" className="pointer-events-auto inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Meet all three of you →
            </a>
          </div>
        </div>
      }
    >
      <Drop />
    </Scene3D>
  );
}
