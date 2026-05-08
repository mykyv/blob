'use client';

import { useControls, folder, Leva, useCreateStore, LevaPanel } from 'leva';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBlobStore } from '@/lib/store';
import type { ClickEffect, BackgroundConfig, EnvPreset } from '@/lib/blob/types';

function HintLabel({ name, hint }: { name: string; hint: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left + r.width / 2, top: r.top });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {name}
      <span
        ref={iconRef}
        aria-label={hint}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 13,
          height: 13,
          borderRadius: '50%',
          border: '1px solid currentColor',
          fontSize: 9,
          lineHeight: 1,
          opacity: 0.5,
          fontWeight: 700,
          userSelect: 'none',
        }}
      >
        ?
      </span>
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                left: pos.left,
                top: pos.top - 8,
                transform: 'translate(-100%, -100%)',
                maxWidth: 240,
                padding: '8px 10px',
                background: 'rgba(20, 14, 30, 0.96)',
                color: '#f3e9ff',
                fontSize: 11,
                lineHeight: 1.4,
                borderRadius: 6,
                border: '1px solid rgba(255, 107, 214, 0.35)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: 10000,
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                whiteSpace: 'normal',
              }}
            >
              {hint}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

const labelCache = new Map<string, JSX.Element>();
const hintLabel = (name: string, hint: string) => {
  const key = `${name}::${hint}`;
  let el = labelCache.get(key);
  if (!el) {
    el = <HintLabel name={name} hint={hint} />;
    labelCache.set(key, el);
  }
  return el;
};

export function ControlsPanel() {
  const config = useBlobStore((s) => s.config);
  const setNested = useBlobStore((s) => s.setNested);
  const setConfig = useBlobStore((s) => s.setConfig);

  const levaStore = useCreateStore();

  useControls(
    {
      Material: folder({
        transmission: {
          value: config.transmission, min: 0, max: 1, step: 0.01,
          label: hintLabel('transmission', 'How much light passes through the blob. 0 = solid, 1 = fully transparent glass.'),
          onChange: (v: number) => setNested('transmission', v),
        },
        ior: {
          value: config.ior, min: 1, max: 2.5, step: 0.01,
          label: hintLabel('ior', 'Index of refraction. Higher values bend light more (water 1.33, glass 1.5, diamond 2.4).'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('ior', v),
        },
        thickness: {
          value: config.thickness, min: 0, max: 2, step: 0.01,
          label: hintLabel('thickness', 'Apparent glass thickness. Affects how much the surface refracts and tints transmitted light.'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('thickness', v),
        },
        roughness: {
          value: config.roughness, min: 0, max: 1, step: 0.01,
          label: hintLabel('roughness', 'Surface micro-roughness. 0 is mirror-smooth, 1 is fully diffuse/frosted.'),
          onChange: (v: number) => setNested('roughness', v),
        },
        chromaticAberration: {
          value: config.chromaticAberration, min: 0, max: 1, step: 0.01,
          label: hintLabel('chromaticAberration', 'Splits transmitted light into RGB fringes for a prism-like edge effect.'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('chromaticAberration', v),
        },
        distortion: {
          value: config.distortion, min: 0, max: 1, step: 0.01,
          label: hintLabel('distortion', 'Warps the refracted background, giving the glass a wobbly, hand-blown look.'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('distortion', v),
        },
        temporalDistortion: {
          value: config.temporalDistortion, min: 0, max: 0.5, step: 0.01,
          label: hintLabel('temporalDistortion', 'Animates the distortion over time so refractions shimmer instead of staying static.'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('temporalDistortion', v),
        },
        attenuationColor: {
          value: config.attenuationColor,
          label: hintLabel('attenuationColor', 'Tint that builds up as light travels through the glass volume.'),
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: string) => setNested('attenuationColor', v),
        },
      }),
      Background: folder({
        bgMode: {
          value: config.background.mode,
          options: ['color', 'gradient', 'image', 'dom-snapshot'] as const,
          label: hintLabel('bgMode', 'Source for the canvas background. dom-snapshot grabs the host page region behind the blob (via html2canvas) so the glass refracts whatever DOM sits behind it.'),
          onChange: (mode: BackgroundConfig['mode']) => {
            if (mode === 'color') setNested('background', { mode: 'color', color: '#0a0418' });
            else if (mode === 'gradient') setNested('background', { mode: 'gradient', from: '#1a1033', to: '#0a0418', angle: 135 });
            else if (mode === 'image') setNested('background', { mode: 'image', url: '' });
            else setNested('background', { mode: 'dom-snapshot' });
          },
        },
        bgColor: {
          value: config.background.mode === 'color' ? config.background.color : '#0a0418',
          label: hintLabel('bgColor', 'Solid background color shown behind the blob.'),
          render: (get) => get('Background.bgMode') === 'color',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'color') setNested('background', { mode: 'color', color: v });
          },
        },
        bgFrom: {
          value: config.background.mode === 'gradient' ? config.background.from : '#1a1033',
          label: hintLabel('bgFrom', 'Gradient start color.'),
          render: (get) => get('Background.bgMode') === 'gradient',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'gradient') setNested('background', { ...cur, from: v });
          },
        },
        bgTo: {
          value: config.background.mode === 'gradient' ? config.background.to : '#0a0418',
          label: hintLabel('bgTo', 'Gradient end color.'),
          render: (get) => get('Background.bgMode') === 'gradient',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'gradient') setNested('background', { ...cur, to: v });
          },
        },
        bgImageUrl: {
          value: config.background.mode === 'image' ? config.background.url : '',
          label: hintLabel('bgImageUrl', 'URL of an image to use as the background (CORS-enabled host required).'),
          render: (get) => get('Background.bgMode') === 'image',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'image') setNested('background', { mode: 'image', url: v });
          },
        },
      }),
      Motion: folder({
        noiseAmplitude: {
          value: config.noiseAmplitude, min: 0, max: 1, step: 0.01,
          label: hintLabel('noiseAmplitude', 'How far the surface deforms from its rest shape. Higher = more wobble.'),
          onChange: (v: number) => setNested('noiseAmplitude', v),
        },
        noiseLowSpeed: {
          value: config.noiseLowSpeed, min: 0, max: 0.5, step: 0.01,
          label: hintLabel('noiseLowSpeed', 'Speed of slow, large-scale undulations. Sets the overall breathing pace.'),
          onChange: (v: number) => setNested('noiseLowSpeed', v),
        },
        noiseHighSpeed: {
          value: config.noiseHighSpeed, min: 0, max: 0.5, step: 0.01,
          label: hintLabel('noiseHighSpeed', 'Speed of fast, fine-scale ripples layered on top of the slow motion.'),
          onChange: (v: number) => setNested('noiseHighSpeed', v),
        },
        trailBiasWeight: {
          value: config.trailBiasWeight, min: 0, max: 1, step: 0.01,
          label: hintLabel('trailBiasWeight', 'How strongly the deformation lags behind the cursor, leaving a trailing shape.'),
          onChange: (v: number) => setNested('trailBiasWeight', v),
        },
        idleDriftAmplitude: {
          value: config.idleDriftAmplitude, min: 0, max: 0.3, step: 0.005,
          label: hintLabel('idleDriftAmplitude', 'Subtle ambient motion when the cursor is still, so the blob never goes fully static.'),
          onChange: (v: number) => setNested('idleDriftAmplitude', v),
        },
      }),
      Cursor: folder({
        followEnabled: {
          value: config.followEnabled,
          label: hintLabel('followEnabled', 'Master toggle for cursor-following behavior.'),
          onChange: (v: boolean) => setNested('followEnabled', v),
        },
        targetLerp: {
          value: config.targetLerp, min: 0.001, max: 0.2, step: 0.001,
          label: hintLabel('targetLerp', 'How quickly the target position chases the cursor. Higher = snappier, lower = lazier.'),
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('targetLerp', v),
        },
        currentLerp: {
          value: config.currentLerp, min: 0.001, max: 0.2, step: 0.001,
          label: hintLabel('currentLerp', 'Smoothing on the actual position toward the target. Lower = more inertia.'),
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('currentLerp', v),
        },
        stretchK: {
          value: config.stretchK, min: 0, max: 5, step: 0.1,
          label: hintLabel('stretchK', 'How much the blob stretches toward the cursor based on cursor velocity.'),
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('stretchK', v),
        },
        maxStretch: {
          value: config.maxStretch, min: 0, max: 3, step: 0.05,
          label: hintLabel('maxStretch', "Upper limit on stretching, so fast cursor movement can't tear the shape apart."),
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('maxStretch', v),
        },
        deadZone: {
          value: config.deadZone, min: 0, max: 0.5, step: 0.01,
          label: hintLabel('deadZone', 'Cursor distance under which no follow happens, preventing jitter near rest.'),
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('deadZone', v),
        },
      }),
      Click: folder({
        clickEnabled: {
          value: config.clickEnabled,
          label: hintLabel('clickEnabled', 'Master toggle for click-triggered effects.'),
          onChange: (v: boolean) => setNested('clickEnabled', v),
        },
        clickEffect: {
          value: config.clickEffect,
          options: ['ripple', 'burst'] as ClickEffect[],
          label: hintLabel('clickEffect', 'Which effect fires on click: ripple wave or outward burst.'),
          render: (get) => get('Click.clickEnabled'),
          onChange: (v: ClickEffect) => setNested('clickEffect', v),
        },
        ripplePropagationSpeed: {
          value: config.ripplePropagationSpeed, min: 0.05, max: 1, step: 0.01,
          label: hintLabel('ripplePropagationSpeed', 'How fast the ripple wave travels across the surface.'),
          render: (get) => get('Click.clickEnabled') && get('Click.clickEffect') === 'ripple',
          onChange: (v: number) => setNested('ripplePropagationSpeed', v),
        },
        rippleAmplitude: {
          value: config.rippleAmplitude, min: 0, max: 2, step: 0.05,
          label: hintLabel('rippleAmplitude', 'Height of the ripple wave at impact.'),
          render: (get) => get('Click.clickEnabled') && get('Click.clickEffect') === 'ripple',
          onChange: (v: number) => setNested('rippleAmplitude', v),
        },
        rippleDecay: {
          value: config.rippleDecay, min: 0.1, max: 5, step: 0.05,
          label: hintLabel('rippleDecay', 'How quickly the ripple fades. Higher = shorter, snappier ripple.'),
          render: (get) => get('Click.clickEnabled') && get('Click.clickEffect') === 'ripple',
          onChange: (v: number) => setNested('rippleDecay', v),
        },
        burstScale: {
          value: config.burstScale, min: 0, max: 1, step: 0.01,
          label: hintLabel('burstScale', 'Size of the outward push at the click point.'),
          render: (get) => get('Click.clickEnabled') && get('Click.clickEffect') === 'burst',
          onChange: (v: number) => setNested('burstScale', v),
        },
      }),
      Environment: folder({
        envIntensity: {
          value: config.envIntensity, min: 0, max: 3, step: 0.05,
          label: hintLabel('envIntensity', 'Brightness of the HDRI environment map. Drives the highlights, reflections, and overall apparent lighting on the glass.'),
          onChange: (v: number) => setNested('envIntensity', v),
        },
        envPreset: {
          value: config.envPreset,
          options: ['studio', 'city', 'sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'park', 'lobby'] as const,
          label: hintLabel('envPreset', 'HDRI scene used to light the blob. Each preset gives a different highlight color and shape.'),
          onChange: (v: EnvPreset) => setNested('envPreset', v),
        },
      }),
      Camera: folder({
        cameraFov: {
          value: config.cameraFov, min: 10, max: 120, step: 1,
          label: hintLabel('cameraFov', 'Field of view in degrees. Low = telephoto/flat, high = wide-angle/distorted.'),
          onChange: (v: number) => setNested('cameraFov', v),
        },
        cameraZ: {
          value: config.cameraZ, min: 1, max: 20, step: 0.1,
          label: hintLabel('cameraZ', 'Camera distance from the blob. Larger = blob appears smaller.'),
          onChange: (v: number) => setNested('cameraZ', v),
        },
      }),
    },
    { store: levaStore },
  );

  return (
    <div style={{ marginTop: '1rem' }}>
      <LevaPanel
        store={levaStore}
        fill
        flat
        titleBar={false}
        theme={{
          colors: {
            elevation1: 'rgba(255,255,255,0.08)',
            elevation2: 'rgba(255,255,255,0.04)',
            elevation3: 'rgba(255,255,255,0.06)',
            accent1: '#ff6bd6',
            accent2: '#ff6bd6',
            accent3: '#ff8ddf',
          },
        }}
      />
    </div>
  );
}
