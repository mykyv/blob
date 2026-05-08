import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../public/embed'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/mount.tsx'),
      name: 'GlassBlob',
      fileName: () => 'glassblob.js',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    },
  },
});
