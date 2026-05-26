'use client';

import { create } from 'zustand';
import { defaultConfig, type BlobConfig } from './blob/types';

interface State {
  config: BlobConfig;
  imageError: string | null;
  setConfig: (patch: Partial<BlobConfig>) => void;
  setNested: <K extends keyof BlobConfig>(key: K, value: BlobConfig[K]) => void;
  setImageError: (msg: string | null) => void;
  replace: (config: BlobConfig) => void;
  reset: () => void;
}

export const useBlobStore = create<State>((set) => ({
  config: defaultConfig,
  imageError: null,
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setNested: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),
  setImageError: (msg) => set({ imageError: msg }),
  replace: (config) => set({ config, imageError: null }),
  reset: () => set({ config: defaultConfig, imageError: null }),
}));
