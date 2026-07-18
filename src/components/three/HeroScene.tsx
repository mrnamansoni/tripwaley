"use client";

/* eslint-disable react-hooks/immutability --
   React Three Fiber's useFrame is an imperative escape hatch: mutating
   three.js objects (camera position, scratch vectors) per frame IS the
   intended pattern and never touches React state. */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollTrigger } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Deterministic value noise (no deps, no Math.random → stable across mounts)
--------------------------------------------------------------------------- */
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
function noise2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** fractal brownian motion — gentle falloff keeps ridges soft, not spiky */
function fbm(x: number, y: number): number {
  let v = 0;
  let amp = 0.55;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    v += amp * noise2(x * f, y * f);
    amp *= 0.42;
    f *= 2;
  }
  return v;
}
/** seeded pseudo-random stream for particle/tree placement */
function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------------------------------------------------------------------------
   Shared valley geography — the river meanders down the valley and the
   terrain, trees and camera all agree on where it flows.
--------------------------------------------------------------------------- */
const riverX = (z: number) => Math.sin(z * 0.12 + 1.5) * 1.6;

function terrainHeight(x: number, z: number): number {
  const d = Math.abs(x - riverX(z));
  // valley carve follows the river; extra flattening forms the riverbed
  let valley = 1 - Math.exp(-(d * d) / 34);
  valley *= smooth(clamp01((d - 1.0) / 1.8));
  const n = fbm(x * 0.05 + 11.3, z * 0.05 + 4.7);
  let h = Math.pow(n, 1.6) * 12 * valley;
  h += fbm(x * 0.16, z * 0.16) * 0.45 * valley; // soft small-scale detail
  return h;
}

interface Quality {
  low: boolean;
}

/* ---------------------------------------------------------------------------
   Low-poly Himalayan valley — grassy floor, earthy slopes, snowy crests
--------------------------------------------------------------------------- */
function Terrain({ low }: Quality) {
  const geometry = useMemo(() => {
    const W = 90;
    const D = 60;
    const geo = new THREE.PlaneGeometry(W, D, low ? 80 : 120, low ? 54 : 80);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, -20); // span z ≈ [-50, 10]

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color("#9cb56f");
    const meadow = new THREE.Color("#c3bb7d");
    const earth = new THREE.Color("#c99668");
    const rock = new THREE.Color("#a56a4e");
    const snow = new THREE.Color("#ffffff");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      // altitude bands: grass valley → meadow → earth → rock → snowline
      const t = h / 9;
      if (t < 0.12) tmp.copy(grass).lerp(meadow, t / 0.12);
      else if (t < 0.3) tmp.copy(meadow).lerp(earth, (t - 0.12) / 0.18);
      else if (t < 0.58) tmp.copy(earth).lerp(rock, (t - 0.3) / 0.28);
      else tmp.copy(rock).lerp(snow, Math.min(1, (t - 0.58) / 0.24));
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [low]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
    </mesh>
  );
}

/* ---------------------------------------------------------------------------
   River — a soft blue ribbon meandering down the carved riverbed
--------------------------------------------------------------------------- */
function River() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const idx: number[] = [];
    let row = 0;
    for (let z = 9; z >= -49; z -= 1) {
      const cx = riverX(z);
      const w = 1.15 + Math.sin(z * 0.31) * 0.18;
      verts.push(cx - w, 0.09, z, cx + w, 0.09, z);
      if (row > 0) {
        const a = (row - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      row++;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#5fb7d9"
        emissive="#7fd0e8"
        emissiveIntensity={0.22}
        roughness={0.25}
        metalness={0}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------------------
   Pines — instanced low-poly trees scattered on the grassy lower slopes
--------------------------------------------------------------------------- */
function Pines({ low }: Quality) {
  const count = low ? 60 : 150;
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);

  const placements = useMemo(() => {
    const rand = prng(4242);
    const out: { x: number; y: number; z: number; s: number; rot: number }[] = [];
    let guard = 0;
    while (out.length < count && guard < count * 40) {
      guard++;
      const x = (rand() - 0.5) * 70;
      const z = -rand() * 50 + 2;
      const h = terrainHeight(x, z);
      // grassy/earthy band only — clear of the river and below the snowline
      if (h < 0.35 || h > 4.2) continue;
      // keep the camera's fly-through corridor along the river open;
      // near-field trees need extra clearance so they frame, never block
      const clearance = z > -6 ? 5.5 : 4;
      if (Math.abs(x - riverX(z)) < clearance) continue;
      out.push({ x, y: h, z, s: 0.5 + rand() * 0.6, rot: rand() * Math.PI });
    }
    return out;
  }, [count]);

  useEffect(() => {
    const foliage = foliageRef.current;
    const trunk = trunkRef.current;
    if (!foliage || !trunk) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    placements.forEach((p, i) => {
      q.setFromAxisAngle(up, p.rot);
      m.compose(
        new THREE.Vector3(p.x, p.y + 0.95 * p.s, p.z),
        q,
        new THREE.Vector3(p.s, p.s, p.s)
      );
      foliage.setMatrixAt(i, m);
      m.compose(
        new THREE.Vector3(p.x, p.y + 0.22 * p.s, p.z),
        q,
        new THREE.Vector3(p.s, p.s, p.s)
      );
      trunk.setMatrixAt(i, m);
    });
    foliage.instanceMatrix.needsUpdate = true;
    trunk.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, placements.length]}>
        <coneGeometry args={[0.52, 1.5, 6]} />
        <meshStandardMaterial color="#3e7c4f" flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, placements.length]}>
        <cylinderGeometry args={[0.07, 0.11, 0.45, 5]} />
        <meshStandardMaterial color="#7a5236" flatShading roughness={1} />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------------------------------------------------
   Soft billboard clouds drifting across the sky
--------------------------------------------------------------------------- */
function makeCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const blobs = [
    [70, 78, 44], [120, 62, 52], [175, 76, 46], [105, 92, 40], [150, 95, 36],
  ];
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.6, "rgba(255,255,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  return new THREE.CanvasTexture(c);
}

const CLOUD_SEEDS: [number, number, number, number, number][] = [
  [-22, 11, -34, 13, 0.22],
  [14, 13.5, -40, 17, 0.15],
  [-4, 12, -28, 10, 0.28],
  [24, 10, -26, 11, 0.19],
  [-30, 14, -44, 18, 0.12],
  [6, 15, -48, 20, 0.1],
  [30, 13, -38, 12, 0.24],
  [-14, 9.5, -22, 8, 0.3],
];

function Clouds({ low }: Quality) {
  const tex = useMemo(() => makeCloudTexture(), []);
  const group = useRef<THREE.Group>(null);
  const seeds = low ? CLOUD_SEEDS.slice(0, 4) : CLOUD_SEEDS;

  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((_, delta) => {
    if (!group.current) return;
    for (let i = 0; i < group.current.children.length; i++) {
      const s = group.current.children[i];
      s.position.x += CLOUD_SEEDS[i][4] * delta;
      if (s.position.x > 42) s.position.x = -42; // wrap around
    }
  });

  return (
    <group ref={group}>
      {seeds.map(([x, y, z, scale], i) => (
        <sprite key={i} position={[x, y, z]} scale={[scale, scale * 0.5, 1]}>
          <spriteMaterial map={tex} transparent opacity={0.85} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------------------
   Warm dust particles floating up the valley
--------------------------------------------------------------------------- */
function Particles({ low }: Quality) {
  const count = low ? 130 : 380;
  const ref = useRef<THREE.Points>(null);

  const { geometry, speeds } = useMemo(() => {
    const rand = prng(1337);
    const positions = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 36;
      positions[i * 3 + 1] = rand() * 10 + 0.5;
      positions[i * 3 + 2] = -rand() * 42 + 6;
      spd[i] = 0.15 + rand() * 0.45;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, speeds: spd };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta;
      if (y > 12) y = 0.4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#e0684b" size={0.09} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

/* ---------------------------------------------------------------------------
   Paper planes — properly folded darts (dihedral wings + red keel) flying
   dotted routes through the valley. Two of them, opposite directions.
--------------------------------------------------------------------------- */

/** wings: two triangles angled slightly upward from the spine */
function makeWingGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  // nose, left tip, spine tail / nose, spine tail, right tip
  const v = new Float32Array([
    0, 0, 1.5, -1.15, 0.26, -1.0, 0, 0.02, -1.0,
    0, 0, 1.5, 0, 0.02, -1.0, 1.15, 0.26, -1.0,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

/** keel: the folded belly fin that hangs under the spine */
function makeKeelGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const v = new Float32Array([
    0, 0, 1.5, 0, -0.42, -0.55, 0, 0.02, -1.0,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

interface PlaneRoute {
  points: [number, number, number][];
  speed: number; // negative flies the loop backwards
  phase: number;
  scale: number;
  routeOpacity: number;
}

function PaperPlane({ route }: { route: PlaneRoute }) {
  const planeRef = useRef<THREE.Group>(null);
  const t = useRef(route.phase);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        route.points.map((p) => new THREE.Vector3(...p)),
        true,
        "catmullrom",
        0.65
      ),
    [route.points]
  );

  const routeLine = useMemo(() => {
    const pts = curve.getPoints(260);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
      color: "#c91b20",
      dashSize: 0.32,
      gapSize: 0.26,
      transparent: true,
      opacity: route.routeOpacity,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    return line;
  }, [curve, route.routeOpacity]);

  const wingGeo = useMemo(() => makeWingGeometry(), []);
  const keelGeo = useMemo(() => makeKeelGeometry(), []);

  useEffect(() => () => {
    routeLine.geometry.dispose();
    (routeLine.material as THREE.Material).dispose();
    wingGeo.dispose();
    keelGeo.dispose();
  }, [routeLine, wingGeo, keelGeo]);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    t.current = (((t.current + delta * route.speed) % 1) + 1) % 1;
    const g = planeRef.current;
    if (!g) return;
    const dir = Math.sign(route.speed);
    const p = curve.getPointAt(t.current);
    const tangent = curve.getTangentAt(t.current).multiplyScalar(dir);
    g.position.copy(p);
    g.position.y += Math.sin(state.clock.elapsedTime * 2.2 + route.phase * 7) * 0.12;
    lookTarget.copy(p).add(tangent);
    g.lookAt(lookTarget);
    g.rotation.z = -tangent.x * 0.55; // bank into turns
  });

  return (
    <group>
      <primitive object={routeLine} />
      <group ref={planeRef} scale={route.scale}>
        <mesh geometry={wingGeo}>
          <meshStandardMaterial color="#ffffff" flatShading side={THREE.DoubleSide} roughness={0.55} />
        </mesh>
        <mesh geometry={keelGeo}>
          <meshStandardMaterial color="#c91b20" flatShading side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

const ROUTES: PlaneRoute[] = [
  {
    points: [
      [-18, 6.2, -24], [-8, 7.4, -12], [3, 6.4, -6], [12, 7.8, -14],
      [6, 9, -28], [-8, 8, -32],
    ],
    speed: 0.02,
    phase: 0.15,
    scale: 0.62,
    routeOpacity: 0.5,
  },
  {
    points: [
      [16, 8.6, -30], [7, 9.6, -18], [-3, 8.8, -9], [-13, 9.8, -18],
      [-5, 10.6, -30], [8, 10, -36],
    ],
    speed: -0.016,
    phase: 0.55,
    scale: 0.5,
    routeOpacity: 0.28,
  },
];

/* ---------------------------------------------------------------------------
   Low-poly hot-air balloon, brand red + gold
--------------------------------------------------------------------------- */
function Balloon() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const e = state.clock.elapsedTime;
    // floats clearly above the ridgeline so it never reads as a rising sun
    ref.current.position.y = 9.6 + Math.sin(e * 0.6) * 0.5;
    ref.current.position.x = 18 + Math.sin(e * 0.13) * 1.4;
    ref.current.rotation.y = e * 0.08;
  });
  return (
    <group ref={ref} position={[18, 9.6, -24]} scale={1.35}>
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
  );
}

/* ---------------------------------------------------------------------------
   Camera rig: scroll flies the camera through the valley, cursor adds
   parallax/orbit. All motion is damped → no jank, no snapping.
--------------------------------------------------------------------------- */
function Rig({ scrollRef, pointerRef }: {
  scrollRef: React.RefObject<number>;
  pointerRef: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const s = scrollRef.current ?? 0;
    const px = pointerRef.current?.x ?? 0;
    const py = pointerRef.current?.y ?? 0;

    // travel path: rise slightly, then dive forward into the valley
    const targetZ = 10 - s * 26;
    const targetY = 3.1 + Math.sin(s * Math.PI) * 1.6;
    const targetX = px * 1.4;

    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.4, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 1.6, delta);

    look.set(px * 3, 3.4 + py * 1.4 + s * 2.2, camera.position.z - 12);
    camera.lookAt(look);
  });
  return null;
}

/* ---------------------------------------------------------------------------
   Scene root
--------------------------------------------------------------------------- */
export default function HeroScene({ active }: { active: boolean }) {
  const scrollRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const lowPower = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
    []
  );

  // Scroll progress of the hero section (0→1), read every frame by the Rig.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  // Window-level pointer tracking (the canvas sits under DOM content).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      // pause the render loop entirely when the hero is off-screen
      frameloop={active ? "always" : "never"}
      dpr={lowPower ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 90, position: [0, 3.1, 10] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={["#fdf1e9", 16, 55]} />
      <ambientLight intensity={1.15} color="#fff3e2" />
      <directionalLight position={[-10, 12, -8]} intensity={1.5} color="#ffd9a0" />
      <directionalLight position={[8, 6, 10]} intensity={0.35} color="#ffffff" />

      <Terrain low={lowPower} />
      <River />
      <Pines low={lowPower} />
      <Clouds low={lowPower} />
      <Particles low={lowPower} />
      {ROUTES.map((route, i) => (
        <PaperPlane key={i} route={route} />
      ))}
      <Balloon />
      <Rig scrollRef={scrollRef} pointerRef={pointerRef} />
    </Canvas>
  );
}
