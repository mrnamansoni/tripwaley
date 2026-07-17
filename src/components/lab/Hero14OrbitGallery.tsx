"use client";

 

/* HERO 14 — "The Carousel"
   You stand at the centre of a slowly turning ring of destination cards;
   scroll spins the carousel, and the destination label swaps as each card
   sweeps the front. */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";

const STOPS = [
  { img: "/images/ladakh.jpg", name: "Ladakh" },
  { img: "/images/kerala.jpg", name: "Kerala" },
  { img: "/images/kashmir.jpg", name: "Kashmir" },
  { img: "/images/meghalaya.jpg", name: "Meghalaya" },
  { img: "/images/andaman.jpg", name: "Andaman" },
  { img: "/images/spiti.jpg", name: "Spiti" },
  { img: "/images/rajasthan.jpg", name: "Jaipur" },
  { img: "/images/snowtrek.jpg", name: "Kedarkantha" },
];
const R = 6.2;
const TURNS = 1.25; // carousel revolutions over the pin

function Ring({ onFront }: { onFront: (i: number) => void }) {
  const { progress, pointer } = useSceneRefs();
  const ring = useRef<THREE.Group>(null);
  const textures = useLoader(THREE.TextureLoader, STOPS.map((s) => s.img));
  const lastFront = useRef(-1);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    const rot = p * Math.PI * 2 * TURNS;
    if (ring.current) {
      ring.current.rotation.y = THREE.MathUtils.damp(ring.current.rotation.y, rot, 3, delta);
    }
    const c = state.camera;
    c.position.x = THREE.MathUtils.damp(c.position.x, px * 0.7, 2, delta);
    c.position.y = THREE.MathUtils.damp(c.position.y, 0.2 + py * 0.45, 2, delta);
    c.lookAt(0, 0, -R);

    // which card faces the camera?
    const step = (Math.PI * 2) / STOPS.length;
    const front = ((Math.round(rot / step) % STOPS.length) + STOPS.length) % STOPS.length;
    if (front !== lastFront.current) {
      lastFront.current = front;
      onFront(front);
    }
  });

  return (
    <>
      <fog attach="fog" args={["#fef5f0", 8, 22]} />
      <ambientLight intensity={2.2} />
      <group ref={ring}>
        {STOPS.map((s, i) => {
          const a = (i / STOPS.length) * Math.PI * 2;
          return (
            <group key={s.name} position={[Math.sin(a) * R, 0, -Math.cos(a) * R]} rotation={[0, -a, 0]}>
              <mesh>
                <planeGeometry args={[3.4, 4.4]} />
                <meshBasicMaterial map={textures[i]} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
              {/* card frame */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[3.7, 4.7]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}

export default function Hero14OrbitGallery() {
  const [front, setFront] = useState(0);
  const nameRef = useRef<HTMLSpanElement>(null);

  /* label swap animation whenever the front card changes */
  useEffect(() => {
    if (!nameRef.current) return;
    gsap.fromTo(nameRef.current, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" });
  }, [front]);

  const stop = STOPS[front];

  return (
    <Scene3D
      id="hero-sec-14"
      heightVh={300}
      camera={{ fov: 55, near: 0.1, far: 40, position: [0, 0.2, 0.001] }}
      backdropClassName="bg-blush"
      overlay={
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-[9vh]">
          <div className="px-6 text-center">
            <p className="font-script text-2xl text-brand sm:text-3xl">you&apos;re standing in the middle of it</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Spin the <span className="text-brand">carousel.</span>
            </h1>
          </div>

          <div className="px-6 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-ink/45">now facing</p>
            <p className="mt-1 overflow-hidden font-display text-5xl font-extrabold text-ink sm:text-7xl">
              <span ref={nameRef} className="inline-block">
                {stop.name}<span className="text-brand">.</span>
              </span>
            </p>
            <a href="#" className="pointer-events-auto mt-6 inline-block rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Book {stop.name} →
            </a>
          </div>
        </div>
      }
    >
      <Ring onFront={setFront} />
    </Scene3D>
  );
}
