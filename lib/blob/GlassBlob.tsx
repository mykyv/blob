'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';
import type { BlobConfig } from './types';

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

  // Keep camera position/fov in sync with config (Canvas `camera` prop is only initial)
  useEffect(() => {
    camera.position.set(0, 0, config.cameraZ);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = config.cameraFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera, config.cameraZ, config.cameraFov]);

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

  // Cursor tracking
  const rawTarget = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));
  const current = useRef(new THREE.Vector2(0, 0));
  const lastAngle = useRef(0);

  // Click impulses
  const impulses = useRef<Impulse[]>([]);
  const burst = useRef<BurstState | null>(null);
  const flash = useRef<FlashState | null>(null);

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

    const noiseAmt = cfg.noiseAmplitude;

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
    const vertCount = base.length / 3;

    // Pull direction (opposite of cursor lag for trail bias)
    const pullX = -lagX, pullY = -lagY;
    const pullMag = Math.min(Math.sqrt(pullX * pullX + pullY * pullY), 1.8);

    for (let i = 0; i < vertCount; i++) {
      const ix = i * 3;
      const bx = base[ix], by = base[ix + 1], bz = base[ix + 2];

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
        const localT = elapsed - d * (1 / cfg.ripplePropagationSpeed) * 0.18;
        if (localT < 0) continue;
        const env = Math.exp(-localT * cfg.rippleDecay);
        const osc = Math.sin(localT * cfg.rippleOscFrequency);
        const spatial = 1 / (1 + d * cfg.rippleSpatialFalloff);
        wave += env * osc * spatial;
      }
      if (cleanupAfter.length !== impulses.current.length) impulses.current = cleanupAfter;

      const f = 1 + noise * noiseAmt - wave * cfg.rippleAmplitude + trail;
      pos[ix] = bx * f;
      pos[ix + 1] = by * f;
      pos[ix + 2] = bz * f;
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
