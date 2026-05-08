import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlobCanvas } from '@/lib/blob/BlobCanvas';
import { defaultConfig, type BlobConfig } from '@/lib/blob/types';

const mounted = new WeakSet<Element>();

function mountInto(el: HTMLElement, partial: Partial<BlobConfig>) {
  if (mounted.has(el)) return;
  mounted.add(el);
  const config: BlobConfig = { ...defaultConfig, ...partial };
  const root = createRoot(el);
  root.render(React.createElement(BlobCanvas, { config }));
}

function parseConfig(raw: string | null): Partial<BlobConfig> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<BlobConfig>;
  } catch {
    console.warn('[GlassBlob] Invalid data-glassblob JSON');
    return {};
  }
}

function autoMount() {
  const nodes = document.querySelectorAll<HTMLElement>('[data-glassblob]');
  nodes.forEach((el) => {
    const cfg = parseConfig(el.getAttribute('data-glassblob'));
    mountInto(el, cfg);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
}

// Public API
export { mountInto as mount };
export const version = '0.1.0';
