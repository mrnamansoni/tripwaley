"use client";


/* HERO 25 — "Banarasi"
   A full-screen bolt of flowing crimson silk, woven in a shader — deep red
   satin bands with gold thread catching the light. Scroll stirs the fabric;
   the cursor runs a hand across it. Literal luxury. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "./three/Scene3D";
import { gsap } from "@/lib/gsap";

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uStir;   // scroll-driven turbulence 0..1
  uniform vec2 uMouse;   // uv
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.55;
    for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.12;

    // hand-across-the-fabric: local ripple around the cursor
    float md = distance(uv, uMouse);
    float press = exp(-md * 5.0) * 0.35;

    // flowing warp — the weave of the cloth
    float warp = fbm(uv * vec2(2.2, 3.4) + vec2(t, -t * 0.6));
    float folds = sin(uv.x * 7.0 + warp * (3.0 + uStir * 3.0) + t * 2.0 + press * 8.0);
    float sheen = smoothstep(-1.0, 1.0, folds);

    // crimson satin ramp
    vec3 deep = vec3(0.32, 0.03, 0.05);
    vec3 mid  = vec3(0.62, 0.09, 0.11);
    vec3 hot  = vec3(0.91, 0.18, 0.16);
    vec3 col = mix(deep, mid, sheen);
    col = mix(col, hot, pow(sheen, 3.0));

    // gold thread catching light on the fold crests
    float thread = pow(max(0.0, folds), 18.0);
    col += vec3(0.96, 0.64, 0.16) * thread * (0.55 + uStir * 0.45);

    // vignette for the velvet room
    float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function SilkPlane() {
  const { progress, pointer } = useSceneRefs();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const p = progress.current ?? 0;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uStir.value = THREE.MathUtils.damp(m.uniforms.uStir.value, Math.sin(p * Math.PI), 2, delta);
    const px = (pointer.current?.x ?? 0) * 0.5 + 0.5;
    const py = (pointer.current?.y ?? 0) * 0.5 + 0.5;
    m.uniforms.uMouse.value.x = THREE.MathUtils.damp(m.uniforms.uMouse.value.x, px, 3, delta);
    m.uniforms.uMouse.value.y = THREE.MathUtils.damp(m.uniforms.uMouse.value.y, py, 3, delta);
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
          uStir: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        }}
      />
    </mesh>
  );
}

export default function Hero25Silk() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-silk-in]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: "#hero-sec-25", start: "top 55%" } }
      );
      gsap.fromTo("[data-silk-end]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#hero-sec-25", scrub: 0.4, start: "68% bottom", end: "90% bottom" },
      });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="hero-sec-25"
      heightVh={240}
      camera={{ fov: 45, near: 0.1, far: 10, position: [0, 0, 2] }}
      backdropClassName="bg-[#1c0405]"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <p data-silk-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
              Woven for wanderers
            </p>
            <h1
              data-silk-in
              className="mt-6 max-w-4xl text-5xl font-light leading-[1.05] text-[#fdf3e3] sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Cut from a
              <br />
              <em className="italic text-gold">different cloth</em>
            </h1>
            <p data-silk-in className="mt-8 max-w-md text-sm leading-relaxed text-[#fdf3e3]/65">
              Group travel, tailored like couture — hand-picked stays, silk-smooth
              logistics, and not a single loose thread.
            </p>
            <a
              data-silk-in
              href="#"
              className="pointer-events-auto mt-10 border border-gold/70 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-[#1c0405]"
            >
              Feel the difference
            </a>
          </div>
          <p data-silk-end className="absolute inset-x-0 bottom-[9%] text-center font-script text-2xl text-gold/85 opacity-0 sm:text-3xl">
            run your cursor across it — resham, na?
          </p>
        </div>
      }
    >
      <SilkPlane />
    </Scene3D>
  );
}
