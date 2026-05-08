'use client';

import { create } from 'zustand';
import { defaultConfig, type BlobConfig } from './blob/types';

interface State {
  config: BlobConfig;
  setConfig: (patch: Partial<BlobConfig>) => void;
  setNested: <K extends keyof BlobConfig>(key: K, value: BlobConfig[K]) => void;
  replace: (config: BlobConfig) => void;
  reset: () => void;
}

export const useBlobStore = create<State>((set) => ({
  config: defaultConfig,
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setNested: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),
  replace: (config) => set({ config }),
  reset: () => set({ config: defaultConfig }),
}));
