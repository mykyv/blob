'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { decodeConfig, encodeConfig } from '@/lib/encodeParams';
import { randomizeConfig } from '@/lib/blob/randomize';
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
  const [panelEpoch, setPanelEpoch] = useState(0);
  useEffect(() => setMounted(true), []);

  const replaceAndRemount = (next: typeof config) => {
    replace(next);
    setPanelEpoch((n) => n + 1);
  };

  const randomize = () => replaceAndRemount(randomizeConfig(useBlobStore.getState().config));
  const resetAndRemount = () => {
    reset();
    setPanelEpoch((n) => n + 1);
  };

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) replaceAndRemount(decodeConfig(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="constructor">
      <div className="constructor-canvas">
        <BlobCanvas config={config} />
      </div>
      <aside className="constructor-panel">
        <div className="constructor-panel-scroll">
          {mounted && <ControlsPanel key={panelEpoch} />}
        </div>
        <div className="constructor-export">
          <h2>Export</h2>
          <div className="constructor-actions">
            <button className="btn" onClick={randomize}>Randomize</button>
            <button className="btn" onClick={resetAndRemount}>Reset</button>
            <button className="btn btn-primary" onClick={() => setExportOpen(true)}>
              Get embed code
            </button>
          </div>
        </div>
      </aside>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
}
