"use client";

 

/* HERO 12 — "Homeground"
   A hand-carved low-poly planet spins under your scroll; the camera dives
   from orbit down to the surface as destination pins light up. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { fbm, glowTexture } from "./three/util3d";

const PINS: [number, number][] = [
  [0.9, 0.4], [1.9, 1.2], [2.9, 0.7], [4.1, 1.5], [5.2, 0.9],
];

function Planet() {
  const { progress, pointer } = useSceneRefs();
  const world = useRef<THREE.Group>(null);
  const glow = useMemo(() => glowTexture("rgb(245,163,26)"), []);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2, 5);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const sea = new THREE.Color("#5fb7d9");
    const land = new THREE.Color("#9cb56f");
    const hill = new THREE.Color("#c99668");
    const snow = new THREE.Color("#ffffff");
    const v = new THREE.Vector3();
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const n = fbm(v.x * 2.2 + 5, v.y * 2.2 + v.z * 2.2 + 3);
      const h = Math.max(0, n - 0.36) * 1.1;
      v.multiplyScalar(2 + h * 0.55);
      pos.setXYZ(i, v.x, v.y, v.z);
      if (h <= 0.001) tmp.copy(sea);
      else if (h < 0.14) tmp.copy(land);
      else if (h < 0.3) tmp.copy(hill);
      else tmp.copy(snow);
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => { geometry.dispose(); glow.dispose(); }, [geometry, glow]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    if (world.current) {
      world.current.rotation.y = p * Math.PI * 2.4 + state.clock.elapsedTime * 0.03;
      world.current.rotation.x = 0.35 - p * 0.25;
    }
    const c = state.camera;
    const dist = 9.6 - p * 3.4; // orbit → low pass (planet always reads as a globe)
    c.position.z = THREE.MathUtils.damp(c.position.z, dist, 2.5, delta);
    c.position.x = THREE.MathUtils.damp(c.position.x, px * 0.8, 2, delta);
    c.position.y = THREE.MathUtils.damp(c.position.y, 0.6 + py * 0.5, 2, delta);
    c.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={1.1} color="#fff3e2" />
      <directionalLight position={[6, 4, 8]} intensity={1.6} color="#ffd9a0" />
      <group ref={world}>
        <mesh geometry={geometry}>
          <meshStandardMaterial vertexColors flatShading roughness={1} />
        </mesh>
        {/* destination pins + halos */}
        {PINS.map(([theta, phi], i) => {
          const r = 2.25;
          const x = r * Math.cos(theta) * Math.cos(phi);
          const y = r * Math.sin(phi) * 0.9;
          const z = r * Math.sin(theta) * Math.cos(phi);
          return (
            <group key={i} position={[x, y, z]}>
              <mesh>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#c91b20" />
              </mesh>
              <sprite scale={[0.55, 0.55, 1]}>
                <spriteMaterial map={glow} transparent depthWrite={false} opacity={0.9} />
              </sprite>
            </group>
          );
        })}
        {/* dashed equatorial route */}
        <mesh rotation={[Math.PI / 2.25, 0, 0.4]}>
          <torusGeometry args={[3.1, 0.012, 6, 90]} />
          <meshBasicMaterial color="#c91b20" transparent opacity={0.5} />
        </mesh>
      </group>
      {/* drifting cloud puffs */}
      {[[3.2, 1.4, -1], [-2.8, -0.6, 1.6], [0.4, 2.6, 2.2]].map(([x, y, z], i) => (
        <sprite key={i} position={[x, y, z]} scale={[1.6, 0.8, 1]}>
          <spriteMaterial map={glow} color="#ffffff" transparent opacity={0.25} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

export default function Hero12Planet() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const beats: [string, number, number][] = [
        ["[data-p12-a]", 0.0, 0.28],
        ["[data-p12-b]", 0.36, 0.62],
        ["[data-p12-c]", 0.72, 0.97],
      ];
      beats.forEach(([sel, a, b]) => {
        gsap.fromTo(sel, { autoAlpha: 0, y: 30 }, {
          autoAlpha: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: "#hero-sec-12", scrub: 0.4, start: `${a * 100}% bottom`, end: `${(a + 0.08) * 100}% bottom` },
        });
        if (b < 0.97)
          gsap.to(sel, {
            autoAlpha: 0, y: -24, ease: "none",
            scrollTrigger: { trigger: "#hero-sec-12", scrub: 0.4, start: `${b * 100}% bottom`, end: `${(b + 0.07) * 100}% bottom` },
          });
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-12"
      heightVh={280}
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0.6, 8.2] }}
      backdropClassName="bg-gradient-to-b from-cream via-blush to-[#f9e3d3]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-p12-a className="absolute inset-x-0 top-[12%] px-6 text-center">
            <p className="font-script text-2xl text-brand sm:text-3xl">spin it like you own it</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
              One little <span className="text-brand">planet.</span>
            </h1>
          </div>
          <div data-p12-b className="absolute inset-x-0 top-[14%] px-6 text-center opacity-0">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              One country on it
              <br />
              that has <span className="text-brand">everything.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
              Glaciers, rainforests, deserts, reefs — every red pin is a Tripwaley batch leaving this month.
            </p>
          </div>
          <div data-p12-c className="absolute inset-x-0 bottom-[14%] px-6 text-center opacity-0">
            <p className="font-script text-3xl text-brand">and you&apos;ve barely seen it</p>
            <a href="#" className="pointer-events-auto mt-5 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Fix that — see departures
            </a>
          </div>
        </div>
      }
    >
      <Planet />
    </Scene3D>
  );
}
