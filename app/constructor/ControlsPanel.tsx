'use client';

import { useBlobStore } from '@/lib/store';
import type {
  ClickEffect,
  BackgroundConfig,
  EnvPreset,
} from '@/lib/blob/types';
import {
  Section,
  Slider,
  ColorRow,
  SelectRow,
  Toggle,
  TextRow,
} from './controls/Primitives';

export type ControlsTab = 'design' | 'effects';

const BG_MODES = ['color', 'gradient', 'image', 'dom-snapshot'] as const;
const CLICK_EFFECTS: ClickEffect[] = ['ripple', 'burst'];
const ENV_PRESETS: EnvPreset[] = [
  'studio',
  'city',
  'sunset',
  'dawn',
  'night',
  'warehouse',
  'forest',
  'apartment',
  'park',
  'lobby',
];

export function ControlsPanel({ activeTab }: { activeTab: ControlsTab }) {
  const config = useBlobStore((s) => s.config);
  const set = useBlobStore((s) => s.setNested);
  const setImageError = useBlobStore((s) => s.setImageError);

  const glass = config.transmission > 0.02;
  const bg = config.background;

  const setBgMode = (mode: BackgroundConfig['mode']) => {
    setImageError(null);
    if (mode === 'color') set('background', { mode: 'color', color: '#0a0418' });
    else if (mode === 'gradient')
      set('background', { mode: 'gradient', from: '#1a1033', to: '#0a0418', angle: 135 });
    else if (mode === 'image') set('background', { mode: 'image', url: '' });
    else set('background', { mode: 'dom-snapshot' });
  };

  if (activeTab === 'design') {
    return (
      <div className="controls">
        <Section title="Surface">
          <Slider
            label="transmission" value={config.transmission} min={0} max={1} step={0.01}
            hint="How much light passes through the blob. 0 = solid, 1 = fully transparent glass."
            onChange={(v) => set('transmission', v)}
          />
          {glass && (
            <>
              <Slider
                label="ior" value={config.ior} min={1} max={2.5} step={0.01}
                hint="Index of refraction. Higher values bend light more (water 1.33, glass 1.5, diamond 2.4)."
                onChange={(v) => set('ior', v)}
              />
              <Slider
                label="thickness" value={config.thickness} min={0} max={2} step={0.01}
                hint="Apparent glass thickness. Affects how much the surface refracts and tints transmitted light."
                onChange={(v) => set('thickness', v)}
              />
            </>
          )}
          <Slider
            label="roughness" value={config.roughness} min={0} max={1} step={0.01}
            hint="Surface micro-roughness. 0 is mirror-smooth, 1 is fully diffuse/frosted."
            onChange={(v) => set('roughness', v)}
          />
          {glass && (
            <>
              <Slider
                label="chromaticAberration" value={config.chromaticAberration} min={0} max={1} step={0.01}
                hint="Splits transmitted light into RGB fringes for a prism-like edge effect."
                onChange={(v) => set('chromaticAberration', v)}
              />
              <Slider
                label="distortion" value={config.distortion} min={0} max={1} step={0.01}
                hint="Warps the refracted background, giving the glass a wobbly, hand-blown look."
                onChange={(v) => set('distortion', v)}
              />
              <Slider
                label="temporalDistortion" value={config.temporalDistortion} min={0} max={0.5} step={0.01}
                hint="Animates the distortion over time so refractions shimmer instead of staying static."
                onChange={(v) => set('temporalDistortion', v)}
              />
            </>
          )}
        </Section>

        {glass && (
          <Section title="Colors">
            <ColorRow
              label="attenuationColor" value={config.attenuationColor}
              hint="Tint that builds up as light travels through the glass volume."
              onChange={(v) => set('attenuationColor', v)}
            />
          </Section>
        )}

        <Section title="Environment">
          <Slider
            label="envIntensity" value={config.envIntensity} min={0} max={3} step={0.05}
            hint="Brightness of the HDRI environment map. Drives the highlights, reflections, and overall apparent lighting on the glass."
            onChange={(v) => set('envIntensity', v)}
          />
          <SelectRow
            label="envPreset" value={config.envPreset} options={ENV_PRESETS}
            hint="HDRI scene used to light the blob. Each preset gives a different highlight color and shape."
            onChange={(v) => set('envPreset', v)}
          />
        </Section>

        <Section title="Background">
          <SelectRow
            label="bgMode" value={bg.mode} options={BG_MODES}
            hint="Source for the canvas background. dom-snapshot grabs the host page region behind the blob (via html2canvas) so the glass refracts whatever DOM sits behind it."
            onChange={setBgMode}
          />
          {bg.mode === 'color' && (
            <ColorRow
              label="bgColor" value={bg.color}
              hint="Solid background color shown behind the blob."
              onChange={(v) => set('background', { mode: 'color', color: v })}
            />
          )}
          {bg.mode === 'gradient' && (
            <>
              <ColorRow
                label="bgFrom" value={bg.from}
                hint="Gradient start color."
                onChange={(v) => set('background', { ...bg, from: v })}
              />
              <ColorRow
                label="bgTo" value={bg.to}
                hint="Gradient end color."
                onChange={(v) => set('background', { ...bg, to: v })}
              />
            </>
          )}
          {bg.mode === 'image' && (
            <TextRow
              label="bgImageUrl" value={bg.url} placeholder="https://…"
              hint="URL of an image to use as the background (CORS-enabled host required)."
              onChange={(v) => {
                setImageError(null);
                set('background', { mode: 'image', url: v });
              }}
            />
          )}
        </Section>

        <Section title="Camera">
          <Slider
            label="cameraFov" value={config.cameraFov} min={10} max={120} step={1}
            hint="Field of view in degrees. Low = telephoto/flat, high = wide-angle/distorted."
            onChange={(v) => set('cameraFov', v)}
          />
          <Slider
            label="cameraZ" value={config.cameraZ} min={1} max={20} step={0.1}
            hint="Camera distance from the blob. Larger = blob appears smaller."
            onChange={(v) => set('cameraZ', v)}
          />
        </Section>
      </div>
    );
  }

  // EFFECTS tab
  return (
    <div className="controls">
      <Section title="Motion">
        <Slider
          label="noiseAmplitude" value={config.noiseAmplitude} min={0} max={1} step={0.01}
          hint="How far the surface deforms from its rest shape. Higher = more wobble."
          onChange={(v) => set('noiseAmplitude', v)}
        />
        <Slider
          label="noiseLowSpeed" value={config.noiseLowSpeed} min={0} max={0.5} step={0.01}
          hint="Speed of slow, large-scale undulations. Sets the overall breathing pace."
          onChange={(v) => set('noiseLowSpeed', v)}
        />
        <Slider
          label="noiseHighSpeed" value={config.noiseHighSpeed} min={0} max={0.5} step={0.01}
          hint="Speed of fast, fine-scale ripples layered on top of the slow motion."
          onChange={(v) => set('noiseHighSpeed', v)}
        />
        <Slider
          label="trailBiasWeight" value={config.trailBiasWeight} min={0} max={1} step={0.01}
          hint="How strongly the deformation lags behind the cursor, leaving a trailing shape."
          onChange={(v) => set('trailBiasWeight', v)}
        />
        <Slider
          label="idleDriftAmplitude" value={config.idleDriftAmplitude} min={0} max={0.3} step={0.005}
          hint="Subtle ambient motion when the cursor is still, so the blob never goes fully static."
          onChange={(v) => set('idleDriftAmplitude', v)}
        />
      </Section>

      <Section title="Cursor">
        <Toggle
          label="followEnabled" value={config.followEnabled}
          hint="Master toggle for cursor-following behavior."
          onChange={(v) => set('followEnabled', v)}
        />
        {config.followEnabled && (
          <>
            <Slider
              label="targetLerp" value={config.targetLerp} min={0.001} max={0.2} step={0.001}
              hint="How quickly the target position chases the cursor. Higher = snappier, lower = lazier."
              onChange={(v) => set('targetLerp', v)}
            />
            <Slider
              label="currentLerp" value={config.currentLerp} min={0.001} max={0.2} step={0.001}
              hint="Smoothing on the actual position toward the target. Lower = more inertia."
              onChange={(v) => set('currentLerp', v)}
            />
            <Slider
              label="stretchK" value={config.stretchK} min={0} max={5} step={0.1}
              hint="How much the blob stretches toward the cursor based on cursor velocity."
              onChange={(v) => set('stretchK', v)}
            />
            <Slider
              label="maxStretch" value={config.maxStretch} min={0} max={3} step={0.05}
              hint="Upper limit on stretching, so fast cursor movement can't tear the shape apart."
              onChange={(v) => set('maxStretch', v)}
            />
            <Slider
              label="deadZone" value={config.deadZone} min={0} max={0.5} step={0.01}
              hint="Cursor distance under which no follow happens, preventing jitter near rest."
              onChange={(v) => set('deadZone', v)}
            />
          </>
        )}
      </Section>

      <Section title="Click">
        <Toggle
          label="clickEnabled" value={config.clickEnabled}
          hint="Master toggle for click-triggered effects."
          onChange={(v) => set('clickEnabled', v)}
        />
        {config.clickEnabled && (
          <>
            <SelectRow
              label="clickEffect" value={config.clickEffect} options={CLICK_EFFECTS}
              hint="Which effect fires on click: ripple wave or outward burst."
              onChange={(v) => set('clickEffect', v)}
            />
            {config.clickEffect === 'ripple' && (
              <>
                <Slider
                  label="clickReactionDelay" value={config.clickReactionDelay} min={-0.3} max={0.5} step={0.01}
                  hint="Time between click and visible reaction. Negative = quicker (wave starts closer to peak), positive = adds delay before the wave appears."
                  onChange={(v) => set('clickReactionDelay', v)}
                />
                <Slider
                  label="rippleOscFrequency" value={config.rippleOscFrequency} min={1} max={20} step={0.5}
                  hint="How fast the wave oscillates. Higher = quicker buildup to peak, snappier reaction."
                  onChange={(v) => set('rippleOscFrequency', v)}
                />
                <Slider
                  label="ripplePropagationSpeed" value={config.ripplePropagationSpeed} min={0.05} max={1} step={0.01}
                  hint="How fast the ripple wave travels across the surface."
                  onChange={(v) => set('ripplePropagationSpeed', v)}
                />
                <Slider
                  label="rippleAmplitude" value={config.rippleAmplitude} min={0} max={2} step={0.05}
                  hint="Height of the ripple wave at impact."
                  onChange={(v) => set('rippleAmplitude', v)}
                />
                <Slider
                  label="rippleDecay" value={config.rippleDecay} min={0.1} max={5} step={0.05}
                  hint="How quickly the ripple fades. Higher = shorter, snappier ripple."
                  onChange={(v) => set('rippleDecay', v)}
                />
              </>
            )}
            {config.clickEffect === 'burst' && (
              <Slider
                label="burstScale" value={config.burstScale} min={0} max={1} step={0.01}
                hint="Size of the outward push at the click point."
                onChange={(v) => set('burstScale', v)}
              />
            )}
          </>
        )}
      </Section>
    </div>
  );
}
