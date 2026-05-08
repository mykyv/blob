'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { decodeConfig, encodeConfig } from '@/lib/encodeParams';
import { presets } from '@/lib/blob/types';
import { ControlsPanel } from './ControlsPanel';
import { ExportDialog } from './ExportDialog';

const BlobCanvas = dynamic(
  () => import('@/lib/blob/BlobCanvas').then((m) => m.BlobCanvas),
  { ssr: false },
);

export function ConstructorClient() {
  const config = useBlobStore((s) => s.config);
  const replace = useBlobStore((s) => s.replace);
  const reset = useBlobStore((s) => s.reset);
  const [exportOpen, setExportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) replace(decodeConfig(p));
  }, [replace]);

  // Push to URL on change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const encoded = encodeConfig(config);
      const url = new URL(window.location.href);
      if (encoded === '') {
        url.searchParams.delete('p');
      } else {
        url.searchParams.set('p', encoded);
      }
      window.history.replaceState(null, '', url.toString());
    }, 250);
    return () => clearTimeout(t);
  }, [config]);

  const applyPreset = (name: string) => {
    const p = presets[name];
    if (!p) return;
    replace({ ...useBlobStore.getState().config, ...p } as any);
  };

  return (
    <div className="constructor">
      <div className="constructor-canvas">
        <BlobCanvas config={config} />
      </div>
      <aside className="constructor-panel">
        <h2>Presets</h2>
        <div className="constructor-actions">
          {Object.entries(presets).map(([key, p]) => (
            <button key={key} className="btn" onClick={() => applyPreset(key)}>
              {p.name}
            </button>
          ))}
        </div>

        {mounted && <ControlsPanel />}

        <h2>Export</h2>
        <div className="constructor-actions">
          <button className="btn btn-primary" onClick={() => setExportOpen(true)}>
            Get embed code
          </button>
          <button className="btn" onClick={reset}>Reset</button>
        </div>
      </aside>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
}
