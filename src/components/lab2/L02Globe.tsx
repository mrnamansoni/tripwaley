"use client";

/* L02 — "Orbit" (hero opener)
   A planet of 2,400 points with India burning brand-red, gold flight arcs
   launching out of Delhi with light pips racing along them. Scroll swings
   the globe to face you and dives the camera in. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "../lab/three/Scene3D";
import { glowTexture } from "../lab/three/util3d";
import { latLon } from "./shared";
import { gsap } from "@/lib/gsap";

const R = 2.4;
const DELHI: [number, number] = [28.6, 77.2];
const CITIES: { name: string; ll: [number, number] }[] = [
  { name: "Leh", ll: [34.2, 77.6] },
  { name: "Srinagar", ll: [34.1, 74.8] },
  { name: "Jaipur", ll: [26.9, 75.8] },
  { name: "Kochi", ll: [9.9, 76.3] },
  { name: "Guwahati", ll: [26.1, 91.7] },
  { name: "Port Blair", ll: [11.7, 92.7] },
];

function GlobeScene() {
  const { progress, pointer } = useSceneRefs();
  const group = useRef<THREE.Group>(null);
  const pipsRef = useRef<THREE.Group>(null);
  const glowGold = useMemo(() => glowTexture("#f5a31a"), []);
  const glowRed = useMemo(() => glowTexture("#e82028"), []);

  /* point-cloud planet: fibonacci sphere, India in brand red */
  const { positions, colors } = useMemo(() => {
    const N = 2400;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const warm = new THREE.Color("#cdbfa8");
    const red = new THREE.Color("#e8353c");
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lon = ((((th * 180) / Math.PI) % 360) + 540) % 360 - 180;
      const [px, py, pz] = latLon(lat, lon, R);
      pos.set([px, py, pz], i * 3);
      const india = lat > 6 && lat < 36 && lon > 68 && lon < 98;
      const c = india ? red : warm;
      col.set([c.r, c.g, c.b], i * 3);
      void rad;
    }
    return { positions: pos, colors: col };
  }, []);

  /* gold arcs Delhi → cities, each with a racing pip */
  const arcs = useMemo(() => {
    const a = new THREE.Vector3(...latLon(DELHI[0], DELHI[1], R));
    return CITIES.map((c, i) => {
      const b = new THREE.Vector3(...latLon(c.ll[0], c.ll[1], R));
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.18 + 0.1 * (i % 3)));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));
      return { curve, geo, speed: 0.35 + (i % 3) * 0.12, offset: i / CITIES.length, end: b };
    });
  }, []);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const g = group.current;
    if (g) {
      // swing India to face the camera as you scroll, cursor nudges it
      const targetY = -1.9 + p * 1.55 + (pointer.current?.x ?? 0) * 0.12;
      const targetX = 0.42 - p * 0.28 + (pointer.current?.y ?? 0) * 0.08;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 2.4, delta);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 2.4, delta);
    }
    const cam = state.camera;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, 7.6 - p * 2.6, 2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 0.4 - p * 0.4, 2, delta);
    cam.lookAt(0, 0, 0);
    // race the pips along their arcs
    const t = state.clock.elapsedTime;
    pipsRef.current?.children.forEach((pip, i) => {
      const arc = arcs[i];
      const u = (t * arc.speed + arc.offset) % 1;
      pip.position.copy(arc.curve.getPoint(u));
      const s = 0.1 + Math.sin(u * Math.PI) * 0.1;
      pip.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} vertexColors sizeAttenuation transparent opacity={0.85} depthWrite={false} />
      </points>
      {/* atmosphere hint */}
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshBasicMaterial color="#120d0a" transparent opacity={0.92} />
      </mesh>
      {/* flight arcs */}
      {arcs.map((a, i) => (
        <line key={i}>
          <primitive object={a.geo} attach="geometry" />
          <lineBasicMaterial color="#f5a31a" transparent opacity={0.5} />
        </line>
      ))}
      {/* racing pips */}
      <group ref={pipsRef}>
        {arcs.map((_, i) => (
          <sprite key={i}>
            <spriteMaterial map={glowGold} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
      {/* city pings */}
      {[...CITIES.map((c) => c.ll), DELHI].map((ll, i) => (
        <sprite key={i} position={latLon(ll[0], ll[1], R * 1.01)} scale={[0.22, 0.22, 1]}>
          <spriteMaterial map={glowRed} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

export default function L02Globe() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-l02-in]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.13,
        scrollTrigger: { trigger: "#lab2-l02", start: "top 55%" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="lab2-l02"
      heightVh={260}
      camera={{ fov: 42, near: 0.1, far: 40, position: [0, 0.4, 7.6] }}
      backdropClassName="bg-[#0b0806]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-[12%] px-6 text-center">
            <p data-l02-in className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">
              live from mission control
            </p>
            <h2 data-l02-in className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-[#f6ead2] sm:text-7xl">
              One country.
              <br />
              <span className="text-gold">Six launchpads.</span>
            </h2>
          </div>
          <div className="absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-5 px-6">
            <p data-l02-in className="max-w-md text-center text-sm leading-relaxed text-white/55">
              Every gold line is a route we run weekly out of Delhi. The red dots
              are home turf — scroll to bring them closer.
            </p>
            <a data-l02-in href="#" className="pointer-events-auto inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#0b0806] transition-transform hover:scale-[1.04]">
              Pick a launchpad
            </a>
          </div>
        </div>
      }
    >
      <GlobeScene />
    </Scene3D>
  );
}
