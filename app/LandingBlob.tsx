'use client';

import dynamic from 'next/dynamic';
import { defaultConfig } from '@/lib/blob/types';

const BlobCanvas = dynamic(
  () => import('@/lib/blob/BlobCanvas').then((m) => m.BlobCanvas),
  { ssr: false },
);

const landingConfig = {
  ...defaultConfig,
  background: { mode: 'gradient', from: '#0b0b12', to: '#1a1530', angle: 160 },
} as typeof defaultConfig;

export function LandingBlob() {
  return <BlobCanvas config={landingConfig} />;
}
