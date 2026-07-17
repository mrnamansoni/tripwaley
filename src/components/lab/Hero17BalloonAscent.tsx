"use client";

 

/* HERO 17 — "Altitude Therapy"
   You ride a hot-air balloon: scroll is the burner. The valley shrinks
   beneath you, clouds slide past, an altimeter climbs, and the sky warms
   as you break through the cloud deck. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { fbm, cloudTexture, prng } from "./three/util3d";

const MAX_ALT = 30;

function Ride() {
  const { progress, pointer } = useSceneRefs();
  const balloon = useRef<THREE.Group>(null);
  const clouds = useMemo(() => cloudTexture(), []);

  const terrain = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 70, 70);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color("#9cb56f");
    const rock = new THREE.Color("#b97053");
    const snow = new THREE.Color("#ffffff");
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = Math.pow(fbm(x * 0.05 + 2, z * 0.05 + 6), 1.7) * 9;
      pos.setY(i, h);
      const t = h / 7;
      if (t < 0.4) tmp.copy(grass).lerp(rock, t / 0.4);
      else tmp.copy(rock).lerp(snow, Math.min(1, (t - 0.4) / 0.4));
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const puffs = useMemo(() => {
    const rand = prng(88);
    return Array.from({ length: 14 }, () => ({
      x: (rand() - 0.5) * 60,
      y: 10 + rand() * 12,
      z: (rand() - 0.5) * 60,
      s: 8 + rand() * 9,
    }));
  }, []);

  useEffect(() => () => { terrain.dispose(); clouds.dispose(); }, [terrain, clouds]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    const e = state.clock.elapsedTime;
    const alt = 4 + p * MAX_ALT;

    const c = state.camera;
    c.position.y = THREE.MathUtils.damp(c.position.y, alt, 2.6, delta);
    c.position.x = THREE.MathUtils.damp(c.position.x, px * 1.5, 1.6, delta);
    c.position.z = THREE.MathUtils.damp(c.position.z, 10, 2, delta);
    // gaze: down at the valley early, out to the horizon high up
    c.lookAt(0, alt - 4 + py * 2 + p * 5, -14);

    if (balloon.current) {
      balloon.current.position.set(-5.5 + Math.sin(e * 0.3) * 0.7, alt + 1 + Math.sin(e * 0.7) * 0.4, -6);
      balloon.current.rotation.y = e * 0.12;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#fdf1e9", 20, 90]} />
      <ambientLight intensity={1.25} color="#fff3e2" />
      <directionalLight position={[-10, 16, -6]} intensity={1.6} color="#ffd9a0" />

      <mesh geometry={terrain}>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>

      {/* companion balloon */}
      <group ref={balloon} scale={1.5}>
        <mesh scale={[1, 1.16, 1]}>
          <sphereGeometry args={[1.1, 12, 9]} />
          <meshStandardMaterial color="#c91b20" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[1.06, 1.0, 0.4, 12]} />
          <meshStandardMaterial color="#f5a31a" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0, -1.75, 0]}>
          <boxGeometry args={[0.5, 0.42, 0.5]} />
          <meshStandardMaterial color="#8a5a3b" flatShading roughness={1} />
        </mesh>
      </group>

      {/* the cloud deck you punch through */}
      {puffs.map((s, i) => (
        <sprite key={i} position={[s.x, s.y, s.z]} scale={[s.s, s.s * 0.5, 1]}>
          <spriteMaterial map={clouds} transparent opacity={0.85} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

export default function Hero17BalloonAscent() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { v: 0 };
      gsap.to(st, {
        v: 1, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-17", scrub: true, start: "top top", end: "bottom bottom" },
        onUpdate: () => {
          if (altRef.current) altRef.current.textContent = Math.round(400 + st.v * 2600).toLocaleString("en-IN");
        },
      });
      gsap.to("[data-b17-a]", {
        autoAlpha: 0, y: -30, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-17", scrub: 0.4, start: "22% bottom", end: "40% bottom" },
      });
      gsap.fromTo("[data-b17-b]", { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-17", scrub: 0.4, start: "72% bottom", end: "92% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-17"
      heightVh={300}
      camera={{ fov: 50, near: 0.1, far: 120, position: [0, 4, 10] }}
      backdropClassName="bg-gradient-to-b from-[#fbe3d2] via-blush to-cream"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-b17-a className="absolute inset-x-0 top-[10%] px-6 text-center">
            <p className="font-script text-2xl text-brand sm:text-3xl">scroll = burner</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-8xl">
              Altitude
              <br />
              <span className="text-brand">therapy.</span>
            </h1>
          </div>

          {/* altimeter */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 rounded-2xl border border-line bg-card/80 px-4 py-3 text-right shadow-card backdrop-blur-sm sm:right-10">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/45">altitude</p>
            <p className="font-display text-2xl font-extrabold text-brand tabular-nums sm:text-3xl">
              <span ref={altRef}>400</span>
              <span className="text-sm text-ink/50"> m</span>
            </p>
          </div>

          <div data-b17-b className="absolute inset-x-0 bottom-[12%] px-6 text-center opacity-0">
            <p className="font-script text-3xl text-brand">above the noise, finally</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">Some plans just need altitude.</h2>
            <a href="#" className="pointer-events-auto mt-6 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Take me up →
            </a>
          </div>
        </div>
      }
    >
      <Ride />
    </Scene3D>
  );
}
