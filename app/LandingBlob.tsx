'use client';

import dynamic from 'next/dynamic';
import { defaultConfig } from '@/lib/blob/types';

const BlobCanvas = dynamic(
  () => import('@/lib/blob/BlobCanvas').then((m) => m.BlobCanvas),
  { ssr: false },
);

export function LandingBlob() {
  return <BlobCanvas config={defaultConfig} />;
}
