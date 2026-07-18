"use client";

/* eslint-disable react-hooks/immutability --
   R3F useFrame mutates three.js uniforms imperatively per frame — the
   intended escape-hatch pattern; never touches React state. */

/* HERO 08 — "Liquid Panorama"
   WebGL shader hero: the Himalayan panorama flows like silk — slow liquid
   distortion, cursor ripples, subtle chromatic fringe. R3F, mounted only
   when near the viewport, DPR-capped. */

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform vec2 uMouse;      // uv space
  uniform float uStrength;  // cursor activity 0..1
  uniform vec2 uCover;      // cover-fit scale
  varying vec2 vUv;

  void main() {
    // cover-fit the image
    vec2 uv = (vUv - 0.5) * uCover + 0.5;

    // slow ambient liquid
    float w1 = sin(uv.y * 7.0 + uTime * 0.7) * 0.006;
    float w2 = cos(uv.x * 9.0 + uTime * 0.55) * 0.005;

    // cursor ripple rings
    float d = distance(vUv, uMouse);
    float ripple = sin(d * 46.0 - uTime * 5.0) * exp(-d * 7.0) * 0.016 * uStrength;

    vec2 off = vec2(w1 + ripple, w2 + ripple);
    float fringe = 0.0035 + uStrength * 0.004;

    float r = texture2D(uTex, uv + off + vec2(fringe, 0.0)).r;
    float g = texture2D(uTex, uv + off).g;
    float b = texture2D(uTex, uv + off - vec2(fringe, 0.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function LiquidPlane({ pointer }: { pointer: React.RefObject<{ x: number; y: number; active: number }> }) {
  const tex = useLoader(THREE.TextureLoader, "/images/himalaya-sunrise.jpg");
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // cover-fit math: image is 1600x1067
  const imgAspect = 1600 / 1067;
  const planeAspect = viewport.width / viewport.height;
  const cover: [number, number] =
    planeAspect > imgAspect ? [1, imgAspect / planeAspect] : [planeAspect / imgAspect, 1];

  useFrame((state, delta) => {
    const m = mat.current;
    const p = pointer.current;
    if (!m || !p) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.x = THREE.MathUtils.damp(m.uniforms.uMouse.value.x, p.x, 4, delta);
    m.uniforms.uMouse.value.y = THREE.MathUtils.damp(m.uniforms.uMouse.value.y, p.y, 4, delta);
    m.uniforms.uStrength.value = THREE.MathUtils.damp(m.uniforms.uStrength.value, p.active, 2.5, delta);
    p.active = Math.max(0, p.active - delta * 0.6); // decay when idle
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={{
          uTex: { value: tex },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uStrength: { value: 0 },
          uCover: { value: new THREE.Vector2(...cover) },
        }}
      />
    </mesh>
  );
}

export default function Hero08LiquidShader() {
  const ref = useRef<HTMLElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5, active: 0 });
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMounted(true);
        setVisible(e.isIntersecting);
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = (e.clientX - r.left) / r.width;
      pointer.current.y = 1 - (e.clientY - r.top) / r.height;
      pointer.current.active = 1;
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-end overflow-hidden bg-ink">
      {/* static fallback under the canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/himalaya-sunrise.jpg)" }}
      />
      {mounted && (
        <div className="absolute inset-0" aria-hidden="true">
          <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }}>
            <Suspense fallback={null}>
              <LiquidPlane pointer={pointer} />
            </Suspense>
          </Canvas>
        </div>
      )}

      <div className="pointer-events-none relative z-10 w-full bg-gradient-to-t from-ink/80 via-ink/25 to-transparent">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-8 px-5 pb-16 pt-40 sm:px-8">
          <div>
            <p className="font-script text-2xl text-gold sm:text-3xl">touch the mountains — go on, move your cursor</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[1.0] tracking-tight text-white sm:text-8xl">
              India,
              <br />
              in motion.
            </h1>
          </div>
          <div className="pointer-events-auto max-w-xs">
            <p className="text-sm leading-relaxed text-white/70">
              Nothing about this country sits still — neither should you. Group
              departures every single week.
            </p>
            <a href="#" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Get moving →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
