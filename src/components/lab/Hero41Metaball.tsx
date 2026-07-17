"use client";

/* HERO 41 — "Ink & Gold"
   A full-screen shader of molten metaballs — blobs of crimson and liquid
   gold that merge, split and chase the cursor like mercury. The most
   premium abstract you can ship: brand colours, pure motion, zero clichés. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;   // -1..1 aspect corrected
  uniform vec2 uRes;
  varying vec2 vUv;

  // metaball field
  float ball(vec2 p, vec2 c, float r){ return r / (dot(p - c, p - c) + 0.0008); }

  void main(){
    vec2 uv = (vUv - 0.5);
    uv.x *= uRes.x / uRes.y;
    float t = uTime * 0.35;

    vec2 m = uMouse;
    m.x *= uRes.x / uRes.y;

    float f = 0.0;
    // orbiting blobs
    f += ball(uv, vec2(sin(t) * 0.42, cos(t * 0.9) * 0.32), 0.045 + uScroll * 0.02);
    f += ball(uv, vec2(cos(t * 1.3) * 0.5, sin(t * 0.7) * 0.4), 0.05);
    f += ball(uv, vec2(sin(t * 0.6 + 2.0) * 0.36, cos(t * 1.1 + 1.0) * 0.46), 0.038);
    f += ball(uv, vec2(cos(t * 0.8 + 4.0) * 0.55, sin(t * 1.4 + 3.0) * 0.28), 0.042);
    // the cursor blob — bigger, magnetic
    f += ball(uv, m * 0.6, 0.075 + uScroll * 0.03);

    // surface = smooth iso-threshold
    float surf = smoothstep(0.9, 1.35, f);
    float edge = smoothstep(0.75, 0.95, f) - surf;

    // colour: deep crimson interior, molten gold rim
    vec3 crimson = vec3(0.55, 0.05, 0.08);
    vec3 hot     = vec3(0.86, 0.14, 0.13);
    vec3 gold    = vec3(0.98, 0.68, 0.18);
    vec3 col = mix(crimson, hot, surf);
    col += gold * edge * 1.6;                 // liquid-gold rim
    col += gold * pow(surf, 6.0) * 0.4;       // inner sheen

    // dark velvet background with faint grain gradient
    vec3 bg = mix(vec3(0.06, 0.02, 0.03), vec3(0.10, 0.05, 0.06), vUv.y);
    col = mix(bg, col, clamp(surf + edge, 0.0, 1.0));

    // vignette
    col *= smoothstep(1.3, 0.35, length(vUv - 0.5));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function InkPlane() {
  const { progress, pointer } = useSceneRefs();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const p = progress.current ?? 0;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uScroll.value = THREE.MathUtils.damp(m.uniforms.uScroll.value, Math.sin(p * Math.PI), 2, delta);
    m.uniforms.uMouse.value.x = THREE.MathUtils.damp(m.uniforms.uMouse.value.x, pointer.current?.x ?? 0, 3, delta);
    m.uniforms.uMouse.value.y = THREE.MathUtils.damp(m.uniforms.uMouse.value.y, pointer.current?.y ?? 0, 3, delta);
    m.uniforms.uRes.value.set(size.width, size.height);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        fragmentShader={fragment}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uRes: { value: new THREE.Vector2(1, 1) },
        }}
      />
    </mesh>
  );
}

export default function Hero41Metaball() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-ink-in]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: "#hero-sec-41", start: "top 55%" } });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-41"
      heightVh={240}
      camera={{ fov: 45, near: 0.1, far: 10, position: [0, 0, 2] }}
      backdropClassName="bg-[#0a0203]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p data-ink-in className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">
            liquid gold · crimson ink · your cursor stirs it
          </p>
          <h1
            data-ink-in
            className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[1.0] tracking-tight text-[#fdf3e3] sm:text-8xl"
          >
            Poured, not
            <br />
            <span className="bg-[linear-gradient(110deg,#fdf3e3_35%,#f5a31a_50%,#fdf3e3_65%)] bg-[length:220%_100%] bg-clip-text text-transparent" style={{ animation: "lux-shimmer 4.5s linear infinite" }}>
              packaged.
            </span>
          </h1>
          <p data-ink-in className="mt-6 max-w-md text-base leading-relaxed text-[#fdf3e3]/60">
            Trips mixed by hand, one batch at a time. Nothing off a conveyor
            belt, nothing you&apos;ve seen a hundred times.
          </p>
          <a data-ink-in href="#" className="pointer-events-auto mt-9 inline-flex min-h-12 items-center rounded-full bg-gold px-9 py-4 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#0a0203] transition-transform hover:scale-[1.03]">
            Taste the blend
          </a>
        </div>
      }
    >
      <InkPlane />
    </Scene3D>
  );
}
