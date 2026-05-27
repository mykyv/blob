'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { decodeConfig } from '@/lib/encodeParams';

const BlobCanvas = dynamic(
  () => import('@/lib/blob/BlobCanvas').then((m) => m.BlobCanvas),
  { ssr: false },
);

export function ViewClient() {
  const config = useBlobStore((s) => s.config);
  const replace = useBlobStore((s) => s.replace);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) replace(decodeConfig(p));
    setReady(true);
  }, [replace]);

  if (!ready) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <BlobCanvas config={config} />
    </div>
  );
}
