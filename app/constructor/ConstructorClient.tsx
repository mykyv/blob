'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { decodeConfig, encodeConfig } from '@/lib/encodeParams';
import { randomizeConfig } from '@/lib/blob/randomize';
import { ControlsPanel, type ControlsTab } from './ControlsPanel';
import { ExportDialog } from './ExportDialog';

const BlobCanvas = dynamic(
  () => import('@/lib/blob/BlobCanvas').then((m) => m.BlobCanvas),
  { ssr: false },
);

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const IconShuffle = () => (
  <svg {...svgProps} aria-hidden>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="m4 4 5 5" />
  </svg>
);

const IconLink = () => (
  <svg {...svgProps} aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconCode = () => (
  <svg {...svgProps} aria-hidden>
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
  </svg>
);

export function ConstructorClient() {
  const config = useBlobStore((s) => s.config);
  const replace = useBlobStore((s) => s.replace);

  const [tab, setTab] = useState<ControlsTab>('design');
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const randomize = () =>
    replace(randomizeConfig(useBlobStore.getState().config));

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) replace(decodeConfig(p));
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
        <header className="panel-header">
          <div className="panel-tabs" role="tablist" aria-label="Control groups">
            <button
              role="tab"
              aria-selected={tab === 'design'}
              className={`panel-tab${tab === 'design' ? ' is-active' : ''}`}
              onClick={() => setTab('design')}
            >
              Design
            </button>
            <button
              role="tab"
              aria-selected={tab === 'effects'}
              className={`panel-tab${tab === 'effects' ? ' is-active' : ''}`}
              onClick={() => setTab('effects')}
            >
              Effects
            </button>
          </div>
          <button
            type="button"
            className="icon-btn"
            title="Randomize"
            aria-label="Randomize"
            onClick={randomize}
          >
            <IconShuffle />
          </button>
        </header>

        <div className="constructor-panel-scroll">
          <ImageErrorBanner />
          {mounted && <ControlsPanel activeTab={tab} />}
        </div>

        <footer className="panel-footer">
          <button type="button" className="footer-link" onClick={copyShareLink}>
            <IconLink />
            {copied ? 'Copied!' : 'Copy share link'}
          </button>
          <button
            type="button"
            className="footer-link"
            onClick={() => setExportOpen(true)}
          >
            <IconCode />
            Get embed code
          </button>
        </footer>
      </aside>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
}

function ImageErrorBanner() {
  const imageError = useBlobStore((s) => s.imageError);
  const isImageMode = useBlobStore((s) => s.config.background.mode === 'image');
  if (!isImageMode || !imageError) return null;
  return (
    <div role="alert" className="panel-error">
      {imageError}
    </div>
  );
}
