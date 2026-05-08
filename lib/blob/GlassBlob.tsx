'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';
import type { BlobConfig, ShapeKey } from './types';
import { noiseDampPerShape } from './types';
import { findFarR, shapeSdfs } from './sdfs';

interface Impulse {
  x: number; y: number; z: number;
  start: number;
}

interface BurstState {
  start: number;
}

interface FlashState {
  start: number;
}

interface Props {
  config: BlobConfig;
}

export function GlassBlob({ config }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const stretchRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<any>(null);

  const { viewport, camera, gl } = useThree();

  // Config ref so useFrame doesn't get recreated on every change
  const cfgRef = useRef(config);
  useEffect(() => { cfgRef.current = config; }, [config]);

  // Geometry — only rebuilt on detail change
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, config.detail);
    g.userData.basePositions = (g.attributes.position.array as Float32Array).slice();
    return g;
  }, [config.detail]);

  // Noise instances
  const n1 = useMemo(() => createNoise3D(), []);
  const n2 = useMemo(() => createNoise3D(), []);
  const n3 = useMemo(() => createNoise3D(), []);

  // Morph targets: built async per shape
  const morphTargets = useRef<Record<string, Float32Array>>({});
  const buildState = useRef<{ shape: ShapeKey | null; idx: number; out: Float32Array | null }>({
    shape: null, idx: 0, out: null,
  });

  // Reset built targets when geometry changes (vertex count)
  useEffect(() => {
    morphTargets.current = {};
    buildState.current = { shape: null, idx: 0, out: null };
  }, [geometry]);

  // Cursor tracking
  const rawTarget = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));
  const current = useRef(new THREE.Vector2(0, 0));
  const lastAngle = useRef(0);

  // Click impulses
  const impulses = useRef<Impulse[]>([]);
  const burst = useRef<BurstState | null>(null);
  const flash = useRef<FlashState | null>(null);

  // Morph state
  const morphT = useRef(0);
  const morphCurrent = useRef<ShapeKey>(config.shape);
  const morphPending = useRef<ShapeKey>(config.shape);
  const morphBounceStart = useRef(-Infinity);

  // Watch shape changes
  useEffect(() => {
    morphPending.current = config.shape;
  }, [config.shape]);

  // Mouse listener (window-relative normalized)
  useEffect(() => {
    if (!cfgRef.current.followEnabled) return;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      rawTarget.current.set(
        (e.clientX / w) * 2 - 1,
        -((e.clientY / h) * 2 - 1),
      );
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [config.followEnabled]);

  // Pointer down → click effects
  useEffect(() => {
    if (!cfgRef.current.clickEnabled) return;
    const dom = gl.domElement;
    const onDown = (e: PointerEvent) => {
      const cfg = cfgRef.current;
      if (!cfg.clickEnabled) return;
      const rect = dom.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      // Sphere at blob world position
      if (!groupRef.current) return;
      const center = new THREE.Vector3();
      groupRef.current.getWorldPosition(center);
      const sphere = new THREE.Sphere(center, cfg.rippleHitRadius);
      const hit = new THREE.Vector3();
      const intersected = raycaster.ray.intersectSphere(sphere, hit);
      if (!intersected) return;

      // Local space, normalized
      const local = meshRef.current.worldToLocal(hit.clone()).normalize();

      const t = performance.now() / 1000;
      const fx = cfg.clickEffect;

      const wantsRipple = fx === 'ripple' || fx === 'ripple+burst' || fx === 'ripple+flash' || fx === 'all';
      const wantsBurst = fx === 'burst' || fx === 'ripple+burst' || fx === 'all';
      const wantsFlash = fx === 'flash' || fx === 'ripple+flash' || fx === 'all';

      if (wantsRipple) {
        impulses.current.push({ x: local.x, y: local.y, z: local.z, start: t });
        if (impulses.current.length > cfg.rippleMaxActive) impulses.current.shift();
      }
      if (wantsBurst) burst.current = { start: t };
      if (wantsFlash) flash.current = { start: t };
    };
    dom.addEventListener('pointerdown', onDown);
    return () => dom.removeEventListener('pointerdown', onDown);
  }, [gl, camera, config.clickEnabled, config.clickEffect]);

  // Build morph targets incrementally for a single shape
  const tickBuild = (deadline: number) => {
    const cfg = cfgRef.current;
    const pos = geometry.attributes.position.array as Float32Array;
    const base = geometry.userData.basePositions as Float32Array;
    const vertCount = base.length / 3;

    let st = buildState.current;
    if (st.shape === null || st.shape === 'base') return;
    if (!st.out) st.out = new Float32Array(base.length);

    const sdf = shapeSdfs[st.shape as Exclude<ShapeKey, 'base'>];
    const VERTS_PER_CHUNK = 40;
    let processed = 0;

    while (st.idx < vertCount && processed < VERTS_PER_CHUNK && performance.now() < deadline) {
      const i = st.idx * 3;
      const dx = base[i], dy = base[i + 1], dz = base[i + 2];
      const r = findFarR(sdf, dx, dy, dz);
      st.out[i] = dx * r;
      st.out[i + 1] = dy * r;
      st.out[i + 2] = dz * r;
      st.idx++;
      processed++;
    }

    if (st.idx >= vertCount) {
      morphTargets.current[st.shape] = st.out;
      buildState.current = { shape: null, idx: 0, out: null };
    }
  };

  useFrame((state, delta) => {
    const cfg = cfgRef.current;
    const t = state.clock.elapsedTime;

    // Material live updates
    if (matRef.current) {
      matRef.current.transmission = cfg.transmission;
      matRef.current.ior = cfg.ior;
      matRef.current.thickness = cfg.thickness;
      matRef.current.roughness = cfg.roughness;
      matRef.current.chromaticAberration = cfg.chromaticAberration;
      matRef.current.distortion = cfg.distortion;
      matRef.current.distortionScale = cfg.distortionScale;
      matRef.current.temporalDistortion = cfg.temporalDistortion;
      matRef.current.attenuationDistance = cfg.attenuationDistance;
      // attenuation color + flash
      const flashCol = new THREE.Color(cfg.flashColor);
      const baseCol = new THREE.Color(cfg.attenuationColor);
      let useCol = baseCol;
      if (flash.current) {
        const elapsed = t - flash.current.start;
        if (elapsed > cfg.flashDuration) {
          flash.current = null;
        } else {
          const k = 1 - elapsed / cfg.flashDuration;
          useCol = baseCol.clone().lerp(flashCol, k);
        }
      }
      if (matRef.current.attenuationColor) {
        matRef.current.attenuationColor.copy(useCol);
      } else {
        matRef.current.attenuationColor = useCol;
      }
    }

    // Async morph build
    const pending = morphPending.current;
    const haveTarget = pending === 'base' || morphTargets.current[pending];
    if (!haveTarget && buildState.current.shape !== pending) {
      buildState.current = { shape: pending, idx: 0, out: null };
    }
    if (buildState.current.shape && buildState.current.shape !== 'base') {
      tickBuild(performance.now() + 5);
    }

    // Morph easing — deflate to base, swap, reinflate
    const wantSwap = morphCurrent.current !== pending;
    const targetT = wantSwap ? 0 : 1;
    const easeRate = wantSwap ? cfg.morphEaseOut : cfg.morphEaseIn;
    morphT.current += (targetT - morphT.current) * easeRate;
    if (wantSwap && morphT.current < 0.02 && (pending === 'base' || morphTargets.current[pending])) {
      morphCurrent.current = pending;
      morphBounceStart.current = t;
    }

    const m = morphT.current;
    const dampK = noiseDampPerShape[morphCurrent.current] ?? 0;
    const noiseAmt = cfg.noiseAmplitude * (1 - m * dampK);

    // Cursor follow
    target.current.lerp(rawTarget.current, cfg.targetLerp);
    current.current.lerp(target.current, cfg.currentLerp);
    const lagX = target.current.x - current.current.x;
    const lagY = target.current.y - current.current.y;
    const lagMag = Math.sqrt(lagX * lagX + lagY * lagY);

    // Position with slight idle drift
    const drift = cfg.idleDriftAmplitude;
    if (groupRef.current) {
      groupRef.current.position.set(
        current.current.x * viewport.width * 0.30 + Math.sin(t * 0.17) * drift,
        current.current.y * viewport.height * 0.20 + Math.cos(t * 0.21) * drift,
        0,
      );
    }

    // Stretch
    if (stretchRef.current) {
      let stretch = 0;
      if (lagMag > cfg.deadZone) {
        stretch = Math.min((lagMag - cfg.deadZone) * cfg.stretchK, cfg.maxStretch);
      }
      // Burst overlays a one-shot uniform pulse
      let burstAdd = 0;
      if (burst.current) {
        const elapsed = t - burst.current.start;
        if (elapsed > cfg.burstDuration) burst.current = null;
        else {
          const k = elapsed / cfg.burstDuration;
          burstAdd = Math.sin(k * Math.PI) * cfg.burstScale;
        }
      }
      stretchRef.current.scale.x = (1 + stretch) * (1 + burstAdd);
      stretchRef.current.scale.y = (1 / (1 + stretch * 0.5)) * (1 + burstAdd);
      stretchRef.current.scale.z = (1 / (1 + stretch * 0.5)) * (1 + burstAdd);

      // Angle (rate-limited)
      if (lagMag > cfg.deadZone) {
        const desired = Math.atan2(lagY, lagX);
        let diff = desired - lastAngle.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        diff = Math.max(-cfg.maxAngularStep, Math.min(cfg.maxAngularStep, diff));
        lastAngle.current += diff;
      }
      stretchRef.current.rotation.z = lastAngle.current;
    }

    // Vertex deformation
    const pos = geometry.attributes.position.array as Float32Array;
    const base = geometry.userData.basePositions as Float32Array;
    const morph = morphTargets.current[morphCurrent.current];
    const vertCount = base.length / 3;

    // Pull direction (opposite of cursor lag for trail bias)
    const pullX = -lagX, pullY = -lagY;
    const pullMag = Math.min(Math.sqrt(pullX * pullX + pullY * pullY), 1.8);

    for (let i = 0; i < vertCount; i++) {
      const ix = i * 3;
      const bx = base[ix], by = base[ix + 1], bz = base[ix + 2];

      // Morph target
      let tx = bx, ty = by, tz = bz;
      if (morph && m > 0.001) {
        tx = bx + (morph[ix] - bx) * m;
        ty = by + (morph[ix + 1] - by) * m;
        tz = bz + (morph[ix + 2] - bz) * m;
      }

      // Noise
      const nLow = n1(bx * cfg.noiseLowScale, by * cfg.noiseLowScale, bz * cfg.noiseLowScale + t * cfg.noiseLowSpeed);
      const nHigh = n2(bx * cfg.noiseHighScale, by * cfg.noiseHighScale, bz * cfg.noiseHighScale + t * cfg.noiseHighSpeed);
      const noise = nLow + nHigh * cfg.noiseHighWeight;

      // Trail bias — points facing pull direction wobble more
      const facing = bx * pullX + by * pullY;
      const trail = n3(bx * 1.2 + t * 0.3, by * 1.2, bz * 1.2) * cfg.trailBiasWeight * pullMag * Math.max(0, -facing);

      // Click ripples
      let wave = 0;
      const cleanupAfter: Impulse[] = [];
      for (const imp of impulses.current) {
        const elapsed = t - imp.start;
        if (elapsed > cfg.rippleLifetime) continue;
        cleanupAfter.push(imp);
        const dot = bx * imp.x + by * imp.y + bz * imp.z;
        const d = Math.acos(Math.max(-1, Math.min(1, dot)));
        const localT = elapsed - d * (1 / cfg.ripplePropagationSpeed) * 0.18; // approximate spec: localT = elapsed - d*0.18
        if (localT < 0) continue;
        const env = Math.exp(-localT * cfg.rippleDecay);
        const osc = Math.sin(localT * cfg.rippleOscFrequency);
        const spatial = 1 / (1 + d * cfg.rippleSpatialFalloff);
        wave += env * osc * spatial;
      }
      if (cleanupAfter.length !== impulses.current.length) impulses.current = cleanupAfter;

      // Morph bounce
      let bounce = 0;
      const tau = t - morphBounceStart.current;
      if (tau > 0 && tau < cfg.bounceDuration) {
        bounce = Math.sin(tau * cfg.bounceFrequency) * Math.exp(-tau * cfg.bounceDecay) * cfg.bounceAmplitude * m;
      }

      const f = 1 + noise * noiseAmt - wave * cfg.rippleAmplitude + bounce + trail;
      pos[ix] = tx * f;
      pos[ix + 1] = ty * f;
      pos[ix + 2] = tz * f;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <group ref={groupRef}>
      <group ref={stretchRef}>
        <mesh ref={meshRef} geometry={geometry} scale={config.meshScale}>
          {/* @ts-ignore drei types */}
          <MeshTransmissionMaterial
            ref={matRef}
            transmission={config.transmission}
            ior={config.ior}
            thickness={config.thickness}
            roughness={config.roughness}
            chromaticAberration={config.chromaticAberration}
            distortion={config.distortion}
            distortionScale={config.distortionScale}
            temporalDistortion={config.temporalDistortion}
            attenuationColor={config.attenuationColor}
            attenuationDistance={config.attenuationDistance}
            samples={6}
            resolution={512}
          />
        </mesh>
      </group>
    </group>
  );
}
