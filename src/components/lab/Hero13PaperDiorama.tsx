"use client";

 

/* HERO 13 — "Paper Theatre"
   A layered paper-cutout diorama in real 3D: scroll dollies the camera
   through hand-painted silhouette layers; the cursor shifts the stage. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";
import { prng } from "./three/util3d";

/** painted silhouette strip → alpha texture */
function ridgeTexture(color: string, seed: number, jag: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const rand = prng(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(0, 300);
  let x = 0;
  while (x < 1024) {
    const step = 60 + rand() * 90;
    const y = 180 + rand() * 140 - jag * rand() * 80;
    ctx.lineTo(x + step / 2, y);
    ctx.lineTo(x + step, 240 + rand() * 90);
    x += step;
  }
  ctx.lineTo(1024, 512);
  ctx.closePath();
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}

function birdsTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "#1a1614";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const rand = prng(31);
  for (let i = 0; i < 7; i++) {
    const x = 40 + rand() * 430;
    const y = 40 + rand() * 170;
    const s = 8 + rand() * 10;
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s / 2, y - s, x, y);
    ctx.quadraticCurveTo(x + s / 2, y - s, x + s, y);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const LAYERS: { color: string; z: number; y: number; jag: number }[] = [
  { color: "#f3cbc6", z: -30, y: -1.5, jag: 2.2 }, // far blush peaks
  { color: "#e8b48d", z: -22, y: -2.0, jag: 1.6 },
  { color: "#d99a6c", z: -15, y: -2.4, jag: 1.2 },
  { color: "#b97053", z: -9, y: -2.8, jag: 0.8 },
  { color: "#8a5236", z: -4, y: -3.2, jag: 0.5 }, // near earth
];

function Diorama() {
  const { progress, pointer } = useSceneRefs();
  const stage = useRef<THREE.Group>(null);

  const textures = useMemo(
    () => LAYERS.map((l, i) => ridgeTexture(l.color, 100 + i * 7, l.jag)),
    []
  );
  const birds = useMemo(() => birdsTexture(), []);
  useEffect(() => () => { textures.forEach((t) => t.dispose()); birds.dispose(); }, [textures, birds]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    const c = state.camera;
    c.position.z = THREE.MathUtils.damp(c.position.z, 8 - p * 30, 2.6, delta);
    c.lookAt(0, 0, c.position.z - 10);
    if (stage.current) {
      stage.current.rotation.y = THREE.MathUtils.damp(stage.current.rotation.y, px * 0.06, 2, delta);
      stage.current.position.y = THREE.MathUtils.damp(stage.current.position.y, py * 0.4, 2, delta);
    }
  });

  return (
    <group ref={stage}>
      <ambientLight intensity={2.4} />
      {/* gold sun disc deep in the stage */}
      <mesh position={[-3.5, 2.6, -34]}>
        <circleGeometry args={[2.6, 40]} />
        <meshBasicMaterial color="#f5a31a" />
      </mesh>
      {LAYERS.map((l, i) => (
        <mesh key={i} position={[0, l.y, l.z]}>
          <planeGeometry args={[34 + Math.abs(l.z), 12 + Math.abs(l.z) * 0.32]} />
          <meshBasicMaterial map={textures[i]} transparent side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* bird flocks between layers */}
      <mesh position={[2.5, 2.2, -18]}>
        <planeGeometry args={[7, 3.5]} />
        <meshBasicMaterial map={birds} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-4, 1.2, -11]}>
        <planeGeometry args={[4.5, 2.2]} />
        <meshBasicMaterial map={birds} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

export default function Hero13PaperDiorama() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to("[data-d13-a]", {
        autoAlpha: 0, y: -30, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-13", scrub: 0.4, start: "18% bottom", end: "38% bottom" },
      });
      gsap.fromTo("[data-d13-b]", { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-13", scrub: 0.4, start: "62% bottom", end: "85% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-13"
      heightVh={260}
      camera={{ fov: 46, near: 0.1, far: 60, position: [0, 0, 8] }}
      backdropClassName="bg-gradient-to-b from-cream to-[#fdeadd]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-d13-a className="absolute inset-x-0 top-[10%] px-6 text-center">
            <p className="font-script text-2xl text-brand sm:text-3xl">act one, scene one</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-8xl">
              The paper
              <br />
              <span className="text-brand">theatre.</span>
            </h1>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-ink/45">scroll — the stage is deeper than it looks</p>
          </div>
          <div data-d13-b className="absolute inset-x-0 bottom-[12%] px-6 text-center opacity-0">
            <p className="font-script text-3xl text-brand">every trip is a production</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">We build the set. You steal the show.</h2>
            <a href="#" className="pointer-events-auto mt-6 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Take the stage →
            </a>
          </div>
        </div>
      }
    >
      <Diorama />
    </Scene3D>
  );
}
