export type ClickEffect = 'ripple' | 'burst';

export type EnvPreset =
  | 'studio'
  | 'city'
  | 'sunset'
  | 'dawn'
  | 'night'
  | 'warehouse'
  | 'forest'
  | 'apartment'
  | 'park'
  | 'lobby';

export type BackgroundConfig =
  | { mode: 'color'; color: string }
  | { mode: 'gradient'; from: string; to: string; angle: number }
  | { mode: 'image'; url: string }
  | { mode: 'dom-snapshot' };

export interface BlobConfig {
  // Geometry
  detail: number;
  meshScale: number;

  // Material
  transmission: number;
  ior: number;
  thickness: number;
  roughness: number;
  chromaticAberration: number;
  distortion: number;
  distortionScale: number;
  temporalDistortion: number;
  attenuationColor: string;
  attenuationDistance: number;

  // Background
  background: BackgroundConfig;

  // Noise
  noiseAmplitude: number;
  noiseLowScale: number;
  noiseLowSpeed: number;
  noiseHighScale: number;
  noiseHighSpeed: number;
  noiseHighWeight: number;
  trailBiasWeight: number;

  // Cursor follow
  followEnabled: boolean;
  targetLerp: number;
  currentLerp: number;
  stretchK: number;
  maxStretch: number;
  deadZone: number;
  maxAngularStep: number;
  idleDriftAmplitude: number;

  // Click ripples / effect
  clickEnabled: boolean;
  clickEffect: ClickEffect;
  clickReactionDelay: number;
  ripplePropagationSpeed: number;
  rippleOscFrequency: number;
  rippleDecay: number;
  rippleSpatialFalloff: number;
  rippleAmplitude: number;
  rippleHitRadius: number;
  rippleMaxActive: number;
  rippleLifetime: number;
  burstScale: number;
  burstDuration: number;

  // Environment lighting
  envIntensity: number;
  envPreset: EnvPreset;

  // Layout
  cameraFov: number;
  cameraZ: number;
}

export const defaultConfig: BlobConfig = {
  detail: 18,
  meshScale: 0.95,

  transmission: 1,
  ior: 1.25,
  thickness: 0.35,
  roughness: 0.02,
  chromaticAberration: 0.35,
  distortion: 0.15,
  distortionScale: 0.25,
  temporalDistortion: 0.08,
  attenuationColor: '#ffffff',
  attenuationDistance: 1.0,

  background: { mode: 'color', color: '#ffffff' },

  noiseAmplitude: 0.32,
  noiseLowScale: 0.75,
  noiseLowSpeed: 0.07,
  noiseHighScale: 1.8,
  noiseHighSpeed: 0.12,
  noiseHighWeight: 0.08,
  trailBiasWeight: 0.45,

  followEnabled: false,
  targetLerp: 0.018,
  currentLerp: 0.012,
  stretchK: 1.9,
  maxStretch: 1.15,
  deadZone: 0.05,
  maxAngularStep: 0.004,
  idleDriftAmplitude: 0.04,

  clickEnabled: true,
  clickEffect: 'ripple',
  clickReactionDelay: 0,
  ripplePropagationSpeed: 4,
  rippleOscFrequency: 10.0,
  rippleDecay: 1.15,
  rippleSpatialFalloff: 0.45,
  rippleAmplitude: 0.55,
  rippleHitRadius: 1.7,
  rippleMaxActive: 4,
  rippleLifetime: 5,
  burstScale: 0.18,
  burstDuration: 0.5,

  envIntensity: 1.0,
  envPreset: 'studio',

  cameraFov: 40,
  cameraZ: 5,
};
