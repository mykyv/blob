'use client';

import { useControls, folder, Leva, useCreateStore, LevaPanel } from 'leva';
import { useEffect } from 'react';
import { useBlobStore } from '@/lib/store';
import type { ShapeKey, ClickEffect, BackgroundConfig } from '@/lib/blob/types';

export function ControlsPanel() {
  const config = useBlobStore((s) => s.config);
  const setNested = useBlobStore((s) => s.setNested);
  const setConfig = useBlobStore((s) => s.setConfig);

  const levaStore = useCreateStore();

  // Shape
  useControls(
    {
      Shape: folder({
        shape: {
          value: config.shape,
          options: ['base', 'laptop', 'camera', 'pen', 'book', 'fuji'] as ShapeKey[],
          onChange: (v: ShapeKey) => setNested('shape', v),
          transient: false,
        },
        morphEaseIn: { value: config.morphEaseIn, min: 0.01, max: 0.5, step: 0.01, onChange: (v: number) => setNested('morphEaseIn', v) },
        bounceAmplitude: { value: config.bounceAmplitude, min: 0, max: 0.2, step: 0.005, onChange: (v: number) => setNested('bounceAmplitude', v) },
      }),
      Material: folder({
        transmission: {
          value: config.transmission, min: 0, max: 1, step: 0.01,
          onChange: (v: number) => setNested('transmission', v),
        },
        ior: {
          value: config.ior, min: 1, max: 2.5, step: 0.01,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('ior', v),
        },
        thickness: {
          value: config.thickness, min: 0, max: 2, step: 0.01,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('thickness', v),
        },
        roughness: {
          value: config.roughness, min: 0, max: 1, step: 0.01,
          onChange: (v: number) => setNested('roughness', v),
        },
        chromaticAberration: {
          value: config.chromaticAberration, min: 0, max: 1, step: 0.01,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('chromaticAberration', v),
        },
        distortion: {
          value: config.distortion, min: 0, max: 1, step: 0.01,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('distortion', v),
        },
        temporalDistortion: {
          value: config.temporalDistortion, min: 0, max: 0.5, step: 0.01,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: number) => setNested('temporalDistortion', v),
        },
        attenuationColor: {
          value: config.attenuationColor,
          render: (get) => get('Material.transmission') > 0.02,
          onChange: (v: string) => setNested('attenuationColor', v),
        },
      }),
      Background: folder({
        bgMode: {
          value: config.background.mode,
          options: ['color', 'gradient', 'image'] as const,
          onChange: (mode: BackgroundConfig['mode']) => {
            if (mode === 'color') setNested('background', { mode: 'color', color: '#0a0418' });
            else if (mode === 'gradient') setNested('background', { mode: 'gradient', from: '#1a1033', to: '#0a0418', angle: 135 });
            else setNested('background', { mode: 'image', url: '' });
          },
        },
        bgColor: {
          value: config.background.mode === 'color' ? config.background.color : '#0a0418',
          render: (get) => get('Background.bgMode') === 'color',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'color') setNested('background', { mode: 'color', color: v });
          },
        },
        bgFrom: {
          value: config.background.mode === 'gradient' ? config.background.from : '#1a1033',
          render: (get) => get('Background.bgMode') === 'gradient',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'gradient') setNested('background', { ...cur, from: v });
          },
        },
        bgTo: {
          value: config.background.mode === 'gradient' ? config.background.to : '#0a0418',
          render: (get) => get('Background.bgMode') === 'gradient',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'gradient') setNested('background', { ...cur, to: v });
          },
        },
        bgImageUrl: {
          value: config.background.mode === 'image' ? config.background.url : '',
          render: (get) => get('Background.bgMode') === 'image',
          onChange: (v: string) => {
            const cur = useBlobStore.getState().config.background;
            if (cur.mode === 'image') setNested('background', { mode: 'image', url: v });
          },
        },
      }),
      Motion: folder({
        noiseAmplitude: { value: config.noiseAmplitude, min: 0, max: 1, step: 0.01, onChange: (v: number) => setNested('noiseAmplitude', v) },
        noiseLowSpeed: { value: config.noiseLowSpeed, min: 0, max: 0.5, step: 0.01, onChange: (v: number) => setNested('noiseLowSpeed', v) },
        noiseHighSpeed: { value: config.noiseHighSpeed, min: 0, max: 0.5, step: 0.01, onChange: (v: number) => setNested('noiseHighSpeed', v) },
        trailBiasWeight: { value: config.trailBiasWeight, min: 0, max: 1, step: 0.01, onChange: (v: number) => setNested('trailBiasWeight', v) },
        idleDriftAmplitude: { value: config.idleDriftAmplitude, min: 0, max: 0.3, step: 0.005, onChange: (v: number) => setNested('idleDriftAmplitude', v) },
      }),
      Cursor: folder({
        followEnabled: { value: config.followEnabled, onChange: (v: boolean) => setNested('followEnabled', v) },
        targetLerp: {
          value: config.targetLerp, min: 0.001, max: 0.2, step: 0.001,
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('targetLerp', v),
        },
        currentLerp: {
          value: config.currentLerp, min: 0.001, max: 0.2, step: 0.001,
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('currentLerp', v),
        },
        stretchK: {
          value: config.stretchK, min: 0, max: 5, step: 0.1,
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('stretchK', v),
        },
        maxStretch: {
          value: config.maxStretch, min: 0, max: 3, step: 0.05,
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('maxStretch', v),
        },
        deadZone: {
          value: config.deadZone, min: 0, max: 0.5, step: 0.01,
          render: (get) => get('Cursor.followEnabled'),
          onChange: (v: number) => setNested('deadZone', v),
        },
      }),
      Click: folder({
        clickEnabled: { value: config.clickEnabled, onChange: (v: boolean) => setNested('clickEnabled', v) },
        clickEffect: {
          value: config.clickEffect,
          options: ['none', 'ripple', 'burst', 'flash', 'ripple+burst', 'ripple+flash', 'all'] as ClickEffect[],
          render: (get) => get('Click.clickEnabled'),
          onChange: (v: ClickEffect) => setNested('clickEffect', v),
        },
        ripplePropagationSpeed: {
          value: config.ripplePropagationSpeed, min: 0.05, max: 1, step: 0.01,
          render: (get) => {
            if (!get('Click.clickEnabled')) return false;
            const e = get('Click.clickEffect') as string;
            return e === 'all' || e.includes('ripple');
          },
          onChange: (v: number) => setNested('ripplePropagationSpeed', v),
        },
        rippleAmplitude: {
          value: config.rippleAmplitude, min: 0, max: 2, step: 0.05,
          render: (get) => {
            if (!get('Click.clickEnabled')) return false;
            const e = get('Click.clickEffect') as string;
            return e === 'all' || e.includes('ripple');
          },
          onChange: (v: number) => setNested('rippleAmplitude', v),
        },
        rippleDecay: {
          value: config.rippleDecay, min: 0.1, max: 5, step: 0.05,
          render: (get) => {
            if (!get('Click.clickEnabled')) return false;
            const e = get('Click.clickEffect') as string;
            return e === 'all' || e.includes('ripple');
          },
          onChange: (v: number) => setNested('rippleDecay', v),
        },
        burstScale: {
          value: config.burstScale, min: 0, max: 1, step: 0.01,
          render: (get) => {
            if (!get('Click.clickEnabled')) return false;
            const e = get('Click.clickEffect') as string;
            return e === 'all' || e.includes('burst');
          },
          onChange: (v: number) => setNested('burstScale', v),
        },
        flashColor: {
          value: config.flashColor,
          render: (get) => {
            if (!get('Click.clickEnabled')) return false;
            const e = get('Click.clickEffect') as string;
            return e === 'all' || e.includes('flash');
          },
          onChange: (v: string) => setNested('flashColor', v),
        },
      }),
      Lighting: folder({
        ambientIntensity: { value: config.ambientIntensity, min: 0, max: 3, step: 0.05, onChange: (v: number) => setNested('ambientIntensity', v) },
        directionalIntensity: { value: config.directionalIntensity, min: 0, max: 3, step: 0.05, onChange: (v: number) => setNested('directionalIntensity', v) },
        fillIntensity: { value: config.fillIntensity, min: 0, max: 3, step: 0.05, onChange: (v: number) => setNested('fillIntensity', v) },
      }),
      Camera: folder({
        cameraFov: { value: config.cameraFov, min: 10, max: 120, step: 1, onChange: (v: number) => setNested('cameraFov', v) },
        cameraZ: { value: config.cameraZ, min: 1, max: 20, step: 0.1, onChange: (v: number) => setNested('cameraZ', v) },
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
            elevation1: 'transparent',
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
