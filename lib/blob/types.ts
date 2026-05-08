export type ClickEffect = 'ripple' | 'burst' | 'flash' | 'ripple+burst' | 'ripple+flash' | 'all' | 'none';

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
  flashColor: string;
  flashDuration: number;

  // Lighting
  ambientIntensity: number;
  directionalIntensity: number;
  fillIntensity: number;

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

  background: { mode: 'gradient', from: '#1a1033', to: '#0a0418', angle: 135 },

  noiseAmplitude: 0.32,
  noiseLowScale: 0.75,
  noiseLowSpeed: 0.07,
  noiseHighScale: 1.8,
  noiseHighSpeed: 0.12,
  noiseHighWeight: 0.08,
  trailBiasWeight: 0.45,

  followEnabled: true,
  targetLerp: 0.018,
  currentLerp: 0.012,
  stretchK: 1.9,
  maxStretch: 1.15,
  deadZone: 0.05,
  maxAngularStep: 0.004,
  idleDriftAmplitude: 0.04,

  clickEnabled: true,
  clickEffect: 'ripple',
  ripplePropagationSpeed: 0.18,
  rippleOscFrequency: 6.0,
  rippleDecay: 1.15,
  rippleSpatialFalloff: 0.45,
  rippleAmplitude: 0.55,
  rippleHitRadius: 1.7,
  rippleMaxActive: 4,
  rippleLifetime: 5,
  burstScale: 0.18,
  burstDuration: 0.5,
  flashColor: '#ff6bd6',
  flashDuration: 0.6,

  ambientIntensity: 0.7,
  directionalIntensity: 0.9,
  fillIntensity: 0.3,

  cameraFov: 40,
  cameraZ: 5,
};
