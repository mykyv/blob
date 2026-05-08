# GlassBlob Constructor

Open-source web tool for designing animated WebGL glass blobs and embedding them anywhere — React, Vue, plain HTML, WordPress, Webflow.

## Stack

- Next.js 15 (App Router) + TypeScript
- React Three Fiber + drei `MeshTransmissionMaterial`
- simplex-noise for organic deformation
- Zustand for state, leva for the controls panel
- Vite library build for the standalone UMD embed

## Local dev

```bash
npm install
npm run dev          # constructor at http://localhost:3000/constructor
npm run build        # builds Next site + embed UMD bundle
npm run build:embed  # only the embed bundle (output: public/embed/glassblob.js)
```

## How the embed works

The constructor exports a one-line snippet:

```html
<div data-glassblob='{"chromaticAberration":0.6}' style="width:100%;height:400px"></div>
<script src="https://glassblob.app/embed/glassblob.js" defer></script>
```

The script auto-scans for `[data-glassblob]` elements, parses the JSON config (merged with defaults), and mounts a React+R3F blob into each one. Multiple blobs per page are supported.

## Project layout

```
app/                 Next.js routes (landing, constructor, about)
lib/blob/            Core blob implementation (shared between Next app + embed)
lib/store.ts         Zustand store
lib/encodeParams.ts  base64 URL param encode/decode
embed/               Vite UMD build for the standalone embed
public/embed/        Built embed output (gitignored)
```

## Credits

Based on the GlassBlob component from the author's portfolio. Architecture details in [can-you-describe-the-dynamic-treasure.md](./can-you-describe-the-dynamic-treasure.md).
