import type { BlobConfig } from './blob/types';
import { defaultConfig } from './blob/types';

const toBase64Url = (s: string) =>
  btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)));
};

// Diff against defaults so URLs stay short
function diffFromDefault(config: BlobConfig): Partial<BlobConfig> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(config) as (keyof BlobConfig)[]) {
    if (JSON.stringify(config[k]) !== JSON.stringify(defaultConfig[k])) {
      out[k as string] = config[k];
    }
  }
  return out as Partial<BlobConfig>;
}

export function encodeConfig(config: BlobConfig): string {
  const diff = diffFromDefault(config);
  return toBase64Url(JSON.stringify(diff));
}

export function decodeConfig(encoded: string): BlobConfig {
  try {
    const diff = JSON.parse(fromBase64Url(encoded)) as Partial<BlobConfig>;
    return { ...defaultConfig, ...diff };
  } catch {
    return defaultConfig;
  }
}
