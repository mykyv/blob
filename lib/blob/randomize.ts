import type { BlobConfig, ClickEffect, EnvPreset } from './types';

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;
const round = (n: number, step: number) => Math.round(n / step) * step;

// Saturated, glass-friendly tints — random hex tends to land on muddy browns
const ATTENUATION_PALETTE = [
  '#ffffff', '#ffe7c2', '#ffd4d4', '#d4ffe0', '#cfe9ff',
  '#e8d4ff', '#fff4a8', '#a8f0ff', '#ffb8e8', '#c8ffd0',
];

const ENV_PRESETS: readonly EnvPreset[] = [
  'studio', 'city', 'sunset', 'dawn', 'night',
  'warehouse', 'forest', 'apartment', 'park', 'lobby',
];

const CLICK_EFFECTS: readonly ClickEffect[] = ['ripple', 'burst'];

export function randomizeConfig(current: BlobConfig): BlobConfig {
  return {
    // Geometry — keep stable (quality, not aesthetics)
    detail: current.detail,
    meshScale: current.meshScale,

    // Material — bounded so the blob always reads as glass
    transmission: round(rand(0.6, 1.0), 0.01),
    ior: round(rand(1.1, 2.0), 0.01),
    thickness: round(rand(0.1, 1.2), 0.01),
    roughness: round(rand(0, 0.35), 0.01),
    chromaticAberration: round(rand(0, 0.7), 0.01),
    distortion: round(rand(0, 0.6), 0.01),
    distortionScale: round(rand(0.1, 0.6), 0.01),
    temporalDistortion: round(rand(0, 0.25), 0.01),
    attenuationColor: pick(ATTENUATION_PALETTE),
    attenuationDistance: round(rand(0.3, 2.0), 0.05),

    // Background — passthrough (user keeps their image/dom-snapshot/etc.)
    background: current.background,

    // Noise / motion
    noiseAmplitude: round(rand(0.12, 0.55), 0.01),
    noiseLowScale: round(rand(0.4, 1.4), 0.05),
    noiseLowSpeed: round(rand(0.03, 0.2), 0.01),
    noiseHighScale: round(rand(1.0, 3.0), 0.05),
    noiseHighSpeed: round(rand(0.05, 0.25), 0.01),
    noiseHighWeight: round(rand(0.03, 0.2), 0.01),
    trailBiasWeight: round(rand(0.15, 0.8), 0.01),

    // Cursor follow — bias toward on so most rolls stay interactive
    followEnabled: chance(0.8),
    targetLerp: round(rand(0.005, 0.05), 0.001),
    currentLerp: round(rand(0.005, 0.04), 0.001),
    stretchK: round(rand(0.5, 3.5), 0.1),
    maxStretch: round(rand(0.7, 1.8), 0.05),
    deadZone: round(rand(0, 0.15), 0.01),
    maxAngularStep: current.maxAngularStep,
    idleDriftAmplitude: round(rand(0.01, 0.12), 0.005),

    // Click — bias toward on
    clickEnabled: chance(0.8),
    clickEffect: pick(CLICK_EFFECTS),
    clickReactionDelay: round(rand(-0.15, 0.25), 0.01),
    ripplePropagationSpeed: round(rand(0.08, 0.6), 0.01),
    rippleOscFrequency: round(rand(4, 16), 0.5),
    rippleDecay: round(rand(0.5, 3), 0.05),
    rippleSpatialFalloff: round(rand(0.25, 0.8), 0.01),
    rippleAmplitude: round(rand(0.2, 1.2), 0.05),
    rippleHitRadius: round(rand(1.0, 2.5), 0.1),
    rippleMaxActive: Math.floor(rand(2, 7)),
    rippleLifetime: round(rand(2, 7), 0.5),
    burstScale: round(rand(0.08, 0.45), 0.01),
    burstDuration: round(rand(0.3, 1.0), 0.05),

    // Environment
    envIntensity: round(rand(0.5, 2.2), 0.05),
    envPreset: pick(ENV_PRESETS),

    // Camera — modest range so framing stays sane
    cameraFov: Math.floor(rand(25, 60)),
    cameraZ: round(rand(3.5, 6.5), 0.1),
  };
}
