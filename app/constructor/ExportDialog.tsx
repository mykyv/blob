'use client';

import { useMemo, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { encodeConfig } from '@/lib/encodeParams';
import { defaultConfig } from '@/lib/blob/types';

type Tab = 'embed' | 'json' | 'url' | 'html';

const EMBED_BASE = typeof window !== 'undefined' ? window.location.origin : 'https://glassblob.app';

function diffJson(config: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(config)) {
    if (JSON.stringify(config[k]) !== JSON.stringify((defaultConfig as any)[k])) {
      out[k] = config[k];
    }
  }
  return out;
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const config = useBlobStore((s) => s.config);
  const [tab, setTab] = useState<Tab>('embed');
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => diffJson(config), [config]);
  const jsonText = useMemo(() => JSON.stringify(diff, null, 2), [diff]);
  const compactJson = useMemo(() => JSON.stringify(diff), [diff]);

  const embedSnippet = `<div data-glassblob='${compactJson.replace(/'/g, '&#39;')}' style="width:100%;height:400px"></div>
<script src="${EMBED_BASE}/embed/glassblob.js" defer></script>`;

  const shareUrl = `${EMBED_BASE}/constructor?p=${encodeConfig(config)}`;

  const standaloneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My GlassBlob</title>
  <style>html,body{margin:0;height:100%;background:#0a0418}#blob{width:100%;height:100%}</style>
</head>
<body>
  <div id="blob" data-glassblob='${compactJson.replace(/'/g, '&#39;')}'></div>
  <script src="${EMBED_BASE}/embed/glassblob.js"></script>
</body>
</html>`;

  const text =
    tab === 'embed' ? embedSnippet :
    tab === 'json' ? jsonText :
    tab === 'url' ? shareUrl :
    standaloneHtml;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([standaloneHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glassblob.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Export your blob</h3>
        <p style={{ opacity: 0.7, fontSize: '0.875rem', margin: 0 }}>
          Pick the format that fits where you're using it.
        </p>
        <div className="tabs">
          <button className={tab === 'embed' ? 'active' : ''} onClick={() => setTab('embed')}>Embed snippet</button>
          <button className={tab === 'url' ? 'active' : ''} onClick={() => setTab('url')}>Share URL</button>
          <button className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}>JSON config</button>
          <button className={tab === 'html' ? 'active' : ''} onClick={() => setTab('html')}>Standalone HTML</button>
        </div>
        <pre>{text}</pre>
        <div className="dialog-actions">
          {tab === 'html' && <button className="btn" onClick={download}>Download .html</button>}
          <button className="btn btn-primary" onClick={copy}>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
