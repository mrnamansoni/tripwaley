"use client";

/* L03 — "The Hangar" (hero opener / brand moment)
   A glossy jet under studio light — clearcoat paint, brand-red tail,
   soft contact shadow — on a scroll-driven turntable. Product-launch
   treatment applied to wanderlust. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import Scene3D, { useSceneRefs } from "../lab/three/Scene3D";
import { gsap } from "@/lib/gsap";

const BODY = new THREE.MeshPhysicalMaterial({ color: "#eceae5", metalness: 0.75, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });
const RED = new THREE.MeshPhysicalMaterial({ color: "#c9252c", metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const GOLD = new THREE.MeshPhysicalMaterial({ color: "#f5a31a", metalness: 0.9, roughness: 0.25 });
const GLASS = new THREE.MeshPhysicalMaterial({ color: "#101418", metalness: 0.4, roughness: 0.08, clearcoat: 1 });
const DARK = new THREE.MeshStandardMaterial({ color: "#2a2a2e", metalness: 0.8, roughness: 0.35 });

function Jet() {
  return (
    <group rotation={[0, 0, 0]}>
      {/* fuselage */}
      <mesh material={BODY} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.36, 3.1, 12, 24]} />
      </mesh>
      {/* nose cone */}
      <mesh material={DARK} position={[1.95, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.22, 0.5, 24]} />
      </mesh>
      {/* cockpit glass */}
      <mesh material={GLASS} position={[1.28, 0.18, 0]} rotation={[0, 0, -0.25]} scale={[0.5, 0.22, 0.3]}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {/* wings */}
      {[1, -1].map((s) => (
        <mesh key={s} material={BODY} position={[0.1, -0.12, s * 1.15]} rotation={[0, s * 0.5, 0.04]}>
          <boxGeometry args={[1.5, 0.06, 2.1]} />
        </mesh>
      ))}
      {/* engines under wings */}
      {[1, -1].map((s) => (
        <group key={s} position={[0.45, -0.32, s * 1.05]}>
          <mesh material={BODY} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.22, 0.7, 20]} />
          </mesh>
          <mesh material={DARK} position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.19, 0.045, 12, 24]} />
          </mesh>
        </group>
      ))}
      {/* brand-red tailfin with gold band */}
      <mesh material={RED} position={[-1.75, 0.5, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.75, 1.05, 0.06]} />
      </mesh>
      <mesh material={GOLD} position={[-1.62, 0.72, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.78, 0.09, 0.065]} />
      </mesh>
      {/* horizontal stabilizers */}
      {[1, -1].map((s) => (
        <mesh key={s} material={RED} position={[-1.78, 0.12, s * 0.5]} rotation={[0, s * 0.42, 0]}>
          <boxGeometry args={[0.62, 0.045, 0.85]} />
        </mesh>
      ))}
      {/* livery stripe */}
      <mesh material={RED} rotation={[0, 0, Math.PI / 2]} position={[-0.4, 0, 0]}>
        <cylinderGeometry args={[0.365, 0.365, 0.14, 32]} />
      </mesh>
    </group>
  );
}

function HangarScene() {
  const { progress, pointer } = useSceneRefs();
  const rig = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const g = rig.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.6 + p * Math.PI * 1.6 + (pointer.current?.x ?? 0) * 0.15, 2.2, delta);
    }
    const cam = state.camera;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, 7.4 - p * 2.1, 2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 1.5 - p * 0.9 + (pointer.current?.y ?? 0) * -0.2, 2, delta);
    cam.lookAt(0, 0.1, 0);
  });

  return (
    <>
      {/* studio rig — no textures, all light */}
      <ambientLight intensity={0.25} />
      <spotLight position={[6, 8, 4]} intensity={220} angle={0.5} penumbra={0.9} color="#fff4e0" />
      <pointLight position={[-7, 2, -5]} intensity={90} color="#f5a31a" />
      <pointLight position={[0, -2, 6]} intensity={30} color="#c9252c" />
      <group ref={rig} position={[0, 0.1, 0]}>
        <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.5}>
          <Jet />
        </Float>
      </group>
      <ContactShadows position={[0, -1.25, 0]} opacity={0.55} scale={12} blur={2.8} far={3} color="#1a0d08" />
    </>
  );
}

export default function L03Fleet() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-l03-in]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.13,
        scrollTrigger: { trigger: "#lab2-l03", start: "top 55%" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="lab2-l03"
      heightVh={240}
      camera={{ fov: 38, near: 0.1, far: 50, position: [0, 1.5, 7.4] }}
      backdropClassName="bg-[radial-gradient(ellipse_at_50%_35%,#241a12_0%,#0c0906_65%)]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-[10%] px-6 text-center">
            <p data-l03-in className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">walkaround · scroll to circle it</p>
            <h2 data-l03-in className="mt-4 font-display text-5xl font-extrabold tracking-tight text-[#f4ead8] sm:text-7xl">
              Built for <span className="text-gold">leaving.</span>
            </h2>
          </div>
          <div className="absolute inset-x-0 bottom-[9%] flex flex-col items-center gap-5 px-6">
            <div data-l03-in className="flex flex-wrap justify-center gap-3">
              {["350 departures / yr", "0 cancelled trips", "4.9★ · 12,000 wanderers"].map((s) => (
                <span key={s} className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[0.66rem] font-bold uppercase tracking-wider text-white/70 backdrop-blur-md">
                  {s}
                </span>
              ))}
            </div>
            <a data-l03-in href="#" className="pointer-events-auto inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Board something →
            </a>
          </div>
        </div>
      }
    >
      <HangarScene />
    </Scene3D>
  );
}
