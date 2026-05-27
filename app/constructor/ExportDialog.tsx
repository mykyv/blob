'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBlobStore } from '@/lib/store';
import { encodeConfig } from '@/lib/encodeParams';
import { defaultConfig } from '@/lib/blob/types';

type Tab = 'embed' | 'iframe' | 'url' | 'json' | 'html';

const TABS: { id: Tab; label: string }[] = [
  { id: 'embed', label: 'Embed' },
  { id: 'iframe', label: 'Iframe' },
  { id: 'url', label: 'Share URL' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
];

const HELP: Partial<Record<Tab, string>> = {
  iframe: "Paste into Notion via /embed, or anywhere that accepts an iframe URL.",
};

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const diff = useMemo(() => diffJson(config), [config]);
  const jsonText = useMemo(() => JSON.stringify(diff, null, 2), [diff]);
  const compactJson = useMemo(() => JSON.stringify(diff), [diff]);

  const embedSnippet = `<div data-glassblob='${compactJson.replace(/'/g, '&#39;')}' style="width:100%;height:400px"></div>
<script src="${EMBED_BASE}/embed/glassblob.js" defer></script>`;

  const shareUrl = `${EMBED_BASE}/constructor?p=${encodeConfig(config)}`;

  const iframeSnippet = `<iframe
  src="${EMBED_BASE}/view?p=${encodeConfig(config)}"
  width="100%"
  height="500"
  style="border:0;display:block"
  allow="autoplay"
  loading="lazy"
  title="GlassBlob"></iframe>`;

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
    tab === 'iframe' ? iframeSnippet :
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
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <aside className="export-sheet" role="dialog" aria-label="Export your blob">
        <header className="export-sheet-header">
          <div>
            <h3>Export</h3>
            <p>Pick the format that fits where you're using it.</p>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <nav className="export-sheet-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="export-sheet-body">
          <div className="code-block">
            <button className="code-copy" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <pre>{text}</pre>
          </div>
          {HELP[tab] && <p className="export-sheet-hint">{HELP[tab]}</p>}
        </div>

        <footer className="export-sheet-footer">
          {tab === 'html' && (
            <button className="btn" onClick={download}>Download .html</button>
          )}
          <button className="btn btn-primary" onClick={copy}>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </footer>
      </aside>
    </>
  );
}
