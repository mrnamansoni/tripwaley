"use client";

/* eslint-disable react-hooks/immutability -- R3F useFrame mutates three.js
   objects imperatively per frame (the intended pattern). */

/* HERO 18 — "Made of Moments"
   Fifteen thousand particles begin as dust, assemble into the Taj at dawn,
   then swirl apart and reform as Dal Lake — every destination is the same
   stardust, rearranged. Scroll drives the whole transmutation. */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { prng, win, smooth } from "./three/util3d";

const GRID_W = 130;
const GRID_H = 86;
const N = GRID_W * GRID_H;
const SPREAD_X = 13;

interface ImageField {
  colors: Float32Array; // N*3
}

/** sample an image into a color field matching the particle grid */
function sampleImage(src: string): Promise<ImageField> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = GRID_W;
      c.height = GRID_H;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, GRID_W, GRID_H);
      const data = ctx.getImageData(0, 0, GRID_W, GRID_H).data;
      const colors = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        colors[i * 3] = data[i * 4] / 255;
        colors[i * 3 + 1] = data[i * 4 + 1] / 255;
        colors[i * 3 + 2] = data[i * 4 + 2] / 255;
      }
      resolve({ colors });
    };
    img.onerror = reject;
    img.src = src;
  });
}

function Dust({ fields }: { fields: ImageField[] }) {
  const { progress, pointer } = useSceneRefs();
  const points = useRef<THREE.Points>(null);

  const { geometry, home, scatter } = useMemo(() => {
    const rand = prng(999);
    const homeArr = new Float32Array(N * 3);
    const scatterArr = new Float32Array(N * 3);
    const colorArr = new Float32Array(N * 3).fill(0.8);
    for (let i = 0; i < N; i++) {
      const gx = i % GRID_W;
      const gy = Math.floor(i / GRID_W);
      homeArr[i * 3] = (gx / GRID_W - 0.5) * SPREAD_X;
      homeArr[i * 3 + 1] = -(gy / GRID_H - 0.5) * (SPREAD_X * (GRID_H / GRID_W));
      homeArr[i * 3 + 2] = (rand() - 0.5) * 0.35;
      scatterArr[i * 3] = (rand() - 0.5) * 30;
      scatterArr[i * 3 + 1] = (rand() - 0.5) * 20;
      scatterArr[i * 3 + 2] = (rand() - 0.5) * 24 - 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(scatterArr.slice(), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));
    return { geometry: geo, home: homeArr, scatter: scatterArr };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;

    // phases: dust → image A (0..0.3), hold, swirl → image B (0.45..0.8)
    const assemble = smooth(win(p, 0.02, 0.3));
    const morph = smooth(win(p, 0.45, 0.8));
    const swirlAmt = Math.sin(morph * Math.PI) * 4.5; // detour during the morph

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const col = geometry.attributes.color as THREE.BufferAttribute;
    const A = fields[0]?.colors;
    const B = fields[1]?.colors;

    for (let i = 0; i < N; i++) {
      const hx = home[i * 3], hy = home[i * 3 + 1], hz = home[i * 3 + 2];
      // scattered → home
      let x = scatter[i * 3] + (hx - scatter[i * 3]) * assemble;
      let y = scatter[i * 3 + 1] + (hy - scatter[i * 3 + 1]) * assemble;
      let z = scatter[i * 3 + 2] + (hz - scatter[i * 3 + 2]) * assemble;
      // swirl detour while morphing between images
      if (swirlAmt > 0.001) {
        const a = (i % 97) * 0.065 + morph * 5;
        x += Math.cos(a) * swirlAmt * 0.4;
        y += Math.sin(a * 1.3) * swirlAmt * 0.22;
        z += Math.sin(a) * swirlAmt * 0.5;
      }
      pos.setXYZ(i, x, y, z);

      if (A && B) {
        const t = morph;
        col.setXYZ(
          i,
          A[i * 3] * (1 - t) + B[i * 3] * t,
          A[i * 3 + 1] * (1 - t) + B[i * 3 + 1] * t,
          A[i * 3 + 2] * (1 - t) + B[i * 3 + 2] * t
        );
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;

    const c = state.camera;
    // pull back on portrait screens so the full image fits the frame
    const aspect = state.size.width / state.size.height;
    const fitZ = 9.5 + Math.max(0, 1 / aspect - 1) * 8;
    c.position.x = THREE.MathUtils.damp(c.position.x, px * 1.6, 2, delta);
    c.position.y = THREE.MathUtils.damp(c.position.y, py * 1.1, 2, delta);
    c.position.z = THREE.MathUtils.damp(c.position.z, fitZ - Math.sin(p * Math.PI) * 1.5, 2, delta);
    c.lookAt(0, 0, 0);
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.075} vertexColors sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Hero18ParticleMorph() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<ImageField[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([sampleImage("/images/taj.jpg"), sampleImage("/images/kashmir.jpg")]).then(
      (f) => alive && setFields(f)
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to("[data-m18-a]", {
        autoAlpha: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-18", scrub: 0.4, start: "8% bottom", end: "24% bottom" },
      });
      gsap.fromTo("[data-m18-b]", { autoAlpha: 0 }, {
        keyframes: [{ autoAlpha: 1, duration: 0.4 }, { autoAlpha: 1, duration: 0.2 }, { autoAlpha: 0, duration: 0.4 }],
        ease: "none",
        scrollTrigger: { trigger: "#hero-sec-18", scrub: 0.4, start: "30% bottom", end: "50% bottom" },
      });
      gsap.fromTo("[data-m18-c]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-18", scrub: 0.4, start: "82% bottom", end: "96% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-18"
      heightVh={320}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 9.5] }}
      backdropClassName="bg-[#141110]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-m18-a className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-script text-2xl text-gold sm:text-3xl">15,000 particles of wanderlust</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-white sm:text-8xl">
              Made of
              <br />
              <span className="text-brand-bright">moments.</span>
            </h1>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/40">scroll — watch the dust remember</p>
          </div>
          <div data-m18-b className="absolute inset-x-0 bottom-[10%] px-6 text-center opacity-0">
            <p className="font-display text-2xl font-extrabold text-white/85 sm:text-4xl">
              same stardust, <span className="text-gold">different postcode</span>
            </p>
          </div>
          <div data-m18-c className="absolute inset-x-0 bottom-[10%] px-6 text-center opacity-0">
            <a href="#" className="pointer-events-auto inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Rearrange yourself →
            </a>
          </div>
        </div>
      }
    >
      {fields.length === 2 && <Dust fields={fields} />}
    </Scene3D>
  );
}
