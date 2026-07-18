"use client";

/* eslint-disable react-hooks/immutability -- R3F useFrame mutates three.js
   objects imperatively per frame (the intended pattern). */

/* HERO 15 — "The Survey"
   Expedition cartography: a gold wireframe landscape rises out of a flat
   grid as you scroll, a red route line draws itself across the ridges, and
   the camera sweeps the survey like a drone. HUD type over ink. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { fbm, win } from "./three/util3d";

const W = 46, D = 34, SX = 70, SY = 50;

function terrainY(x: number, z: number): number {
  return Math.pow(fbm(x * 0.09 + 3, z * 0.09 + 8), 1.6) * 7;
}

function Survey() {
  const { progress, pointer } = useSceneRefs();
  const meshRef = useRef<THREE.Mesh>(null);
  const routeRef = useRef<THREE.Line>(null);

  const { geometry, targets } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(W, D, SX, SY);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const t = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) t[i] = terrainY(pos.getX(i), pos.getZ(i));
    return { geometry: geo, targets: t };
  }, []);

  const route = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const x = -20 + t * 40;
      const z = Math.sin(t * Math.PI * 2.2) * 9;
      pts.push(new THREE.Vector3(x, terrainY(x, z) + 0.35, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#e82028", linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    line.geometry.setDrawRange(0, 0);
    return line;
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    route.geometry.dispose();
    (route.material as THREE.Material).dispose();
  }, [geometry, route]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;

    // terrain builds up during the first third
    const rise = win(p, 0.02, 0.34);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, targets[i] * rise);
    pos.needsUpdate = true;

    // route draws across the middle third
    const drawn = Math.floor(win(p, 0.3, 0.75) * 121);
    route.geometry.setDrawRange(0, drawn);

    // drone sweep
    const c = state.camera;
    const angle = -0.4 + p * 1.1;
    c.position.x = THREE.MathUtils.damp(c.position.x, Math.sin(angle) * 24 + px * 2, 2, delta);
    c.position.z = THREE.MathUtils.damp(c.position.z, Math.cos(angle) * 26, 2, delta);
    c.position.y = THREE.MathUtils.damp(c.position.y, 16 - p * 5 + py * 1.5, 2, delta);
    c.lookAt(0, 1.5, 0);
  });

  return (
    <>
      <group>
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial color="#f5a31a" wireframe transparent opacity={0.38} />
        </mesh>
        <primitive object={route} ref={routeRef} />
        {/* base grid shadow */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W, D, 12, 9]} />
          <meshBasicMaterial color="#f5a31a" wireframe transparent opacity={0.08} />
        </mesh>
      </group>
    </>
  );
}

export default function Hero15Wireframe() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to("[data-w15-a]", {
        autoAlpha: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-15", scrub: 0.4, start: "30% bottom", end: "48% bottom" },
      });
      gsap.fromTo("[data-w15-b]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-15", scrub: 0.4, start: "62% bottom", end: "82% bottom" },
      });
      // live coordinates tick with scroll
      const st = { v: 0 };
      gsap.to(st, {
        v: 1, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-15", scrub: true, start: "top top", end: "bottom bottom" },
        onUpdate: () => {
          if (coordRef.current) {
            const lat = (30.73 + st.v * 3.2).toFixed(4);
            const lon = (77.1 + st.v * 1.9).toFixed(4);
            coordRef.current.textContent = `${lat}° N · ${lon}° E`;
          }
        },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-15"
      heightVh={280}
      camera={{ fov: 48, near: 0.1, far: 80, position: [-8, 12, 20] }}
      backdropClassName="bg-ink"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          {/* HUD chrome */}
          <div className="absolute inset-4 border border-gold/20 sm:inset-8" aria-hidden="true" />
          <p className="absolute left-7 top-7 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-gold/70 sm:left-12 sm:top-12">
            survey / himalaya sector
          </p>
          <p className="absolute right-7 top-7 font-mono text-[0.6rem] tracking-[0.2em] text-gold/70 sm:right-12 sm:top-12">
            <span ref={coordRef}>30.7300° N · 77.1000° E</span>
          </p>

          <div data-w15-a className="absolute inset-x-0 top-[16%] px-8 text-center">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
              We charted it
              <br />
              <span className="text-gold">so you don&apos;t have to.</span>
            </h1>
            <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/45">scroll: raising terrain model</p>
          </div>

          <div data-w15-b className="absolute inset-x-0 bottom-[14%] px-8 text-center opacity-0">
            <p className="font-script text-3xl text-gold">that red line? that&apos;s your week off</p>
            <a href="#" className="pointer-events-auto mt-5 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Follow the route →
            </a>
          </div>
        </div>
      }
    >
      <Survey />
    </Scene3D>
  );
}
