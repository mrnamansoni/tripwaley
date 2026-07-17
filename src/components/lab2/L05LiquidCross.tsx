"use client";

/* L05 — "State Change" (hero opener / transition)
   Two destinations occupy the same pixels: Kashmir melts into Andaman
   through a turbulent liquid displacement driven by scroll. The signature
   awwwards transition, tuned to brand. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Scene3D, { useSceneRefs } from "../lab/three/Scene3D";
import { gsap } from "@/lib/gsap";

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uProg;
  uniform float uTime;
  uniform vec2 uPlane;   // plane aspect
  uniform vec2 uImgA;
  uniform vec2 uImgB;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }

  vec2 cover(vec2 uv, vec2 plane, vec2 img){
    float pr = plane.x / plane.y;
    float ir = img.x / img.y;
    vec2 s = vec2(1.0);
    if (pr > ir) s.y = ir / pr; else s.x = pr / ir;
    return (uv - 0.5) * s + 0.5;
  }

  void main(){
    float n = noise(vUv * 4.0 + uTime * 0.15);
    float n2 = noise(vUv * 9.0 - uTime * 0.1);
    // melt front sweeps bottom-left → top-right with turbulent edge
    float sweep = (vUv.x + (1.0 - vUv.y)) * 0.5;
    float edge = smoothstep(uProg - 0.22, uProg + 0.22, sweep + (n - 0.5) * 0.4);
    float m = 1.0 - edge;
    float turb = (1.0 - abs(2.0 * m - 1.0));

    vec2 dA = (vec2(n, n2) - 0.5) * 0.10 * turb;
    vec2 dB = (vec2(n2, n) - 0.5) * 0.10 * turb;
    vec4 a = texture2D(uA, cover(vUv + dA, uPlane, uImgA));
    vec4 b = texture2D(uB, cover(vUv - dB, uPlane, uImgB));
    vec3 col = mix(a.rgb, b.rgb, m);
    // gold seam light on the melt front
    col += vec3(0.96, 0.64, 0.16) * pow(turb, 5.0) * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function LiquidPlane() {
  const { progress } = useSceneRefs();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const u = {
      uA: { value: null as THREE.Texture | null },
      uB: { value: null as THREE.Texture | null },
      uProg: { value: 0 },
      uTime: { value: 0 },
      uPlane: { value: new THREE.Vector2(16, 9) },
      uImgA: { value: new THREE.Vector2(3, 2) },
      uImgB: { value: new THREE.Vector2(3, 2) },
    };
    loader.load("/images/kashmir.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      u.uA.value = t;
      u.uImgA.value.set(t.image.width, t.image.height);
    });
    loader.load("/images/andaman.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      u.uB.value = t;
      u.uImgB.value.set(t.image.width, t.image.height);
    });
    return u;
  }, []);

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uProg.value = THREE.MathUtils.damp(m.uniforms.uProg.value, progress.current ?? 0, 3.2, delta);
    m.uniforms.uPlane.value.set(viewport.width, viewport.height);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        fragmentShader={frag}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function L05LiquidCross() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // labels swap with the melt
      gsap.to("[data-l05-a]", { autoAlpha: 0, y: -26, ease: "none", scrollTrigger: { trigger: "#lab2-l05", scrub: 0.4, start: "38% bottom", end: "55% bottom" } });
      gsap.fromTo("[data-l05-b]", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: "#lab2-l05", scrub: 0.4, start: "52% bottom", end: "70% bottom" } });
    }, overlayRef);
    return () => ctx.revert();
  }, []);

  return (
    <Scene3D
      id="lab2-l05"
      heightVh={230}
      camera={{ fov: 45, near: 0.1, far: 10, position: [0, 0, 2] }}
      backdropClassName="bg-ink"
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div data-l05-a className="absolute inset-x-0 bottom-[12%] px-6 text-center">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-white/70 drop-shadow">chapter one</p>
            <h2 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl">Kashmir, 12°C</h2>
          </div>
          <div data-l05-b className="absolute inset-x-0 bottom-[12%] px-6 text-center opacity-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-white/70 drop-shadow">same trip, day nine</p>
            <h2 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl">Andaman, 30°C</h2>
          </div>
          <p className="absolute left-1/2 top-[8%] -translate-x-1/2 text-[0.6rem] font-bold uppercase tracking-[0.4em] text-white/60 drop-shadow">
            scroll to change states
          </p>
        </div>
      }
    >
      <LiquidPlane />
    </Scene3D>
  );
}
