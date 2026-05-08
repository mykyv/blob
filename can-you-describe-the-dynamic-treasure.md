# GlassBlob — How it works

A complete breakdown of the blob component on the website, intended as reference for building a custom blob constructor.

Source: [src/components/GlassBlob.jsx](src/components/GlassBlob.jsx)

## Tech stack

- **React Three Fiber** (`@react-three/fiber`) — React renderer for Three.js
- **drei**'s `MeshTransmissionMaterial` — physically-based glass refraction
- **simplex-noise** — smooth pseudo-random noise for organic deformation
- **modern-screenshot** — rasterizes the DOM into a canvas used as the glass background

## Geometry foundation

- A single **`IcosahedronGeometry(1, 18)`** — a sphere built from subdivided triangles. Detail level 18 gives a high vertex count for smooth deformation.
- The **base position array is cached** in `geometry.userData.basePositions` and never mutated. Every frame the displayed positions are recomputed from this immutable reference. This is critical: noise-on-noise accumulation would otherwise drift and explode.

## The "glass" look (MeshTransmissionMaterial)

Key params:
- `transmission: 1`, `ior: 1.25`, `thickness: 0.35` — refraction strength
- `chromaticAberration: 0.35` — RGB split at edges (the rainbow fringe)
- `roughness: 0.02` — near-mirror surface
- `distortion: 0.15`, `distortionScale: 0.25`, `temporalDistortion: 0.08` — wobbling internal refraction
- `background: snapshot` — **the secret sauce**: a CanvasTexture of the actual page DOM

### The DOM snapshot trick (`usePageSnapshot.js`)

- `domToCanvas(document.body, …)` rasterizes the entire page (excluding the WebGL overlay itself, hidden via `data-glass-overlay`)
- That bitmap is uploaded as a Three.js `CanvasTexture` and fed to the transmission material as its `background`
- Result: the blob refracts your real page content (text, photos), giving the illusion the page is *behind* the glass
- Re-snapped on resize and after fonts settle (200 ms initial delay)

## Per-frame vertex animation

Inside `useFrame`, for every vertex:

```
final = lerp(base, morphTarget, m) * (1 + noise * noiseAmt - wave * 0.55 + bounce)
```

Components blended into the radial scalar `f`:

1. **Two simplex noise layers** — `n1` low frequency (0.75) slow drift, `n2` high frequency (1.8) fine detail
2. **Trail bias noise** `n3` — directional noise biased opposite to mouse pull, so the back of the blob ripples when the cursor moves
3. **Click ripples** — propagating waves (see below)
4. **Morph bounce** — damped sine pulse on shape changes

After updating positions: `pos.needsUpdate = true` + `computeVertexNormals()` so lighting and refraction follow the deformed surface.

## Cursor follow + stretch (squash-and-stretch)

Two-stage smoothing chain:

- `rawTarget` ← raw normalized mouse coords
- `target` ← lerps toward `rawTarget` at **0.018**
- `current` ← lerps toward `target` at **0.012**

The blob's **position** uses `current`. Its **stretch** uses `target − current` (the lag vector):

- Magnitude → axial scale: `scale.x = 1 + stretch`, `scale.y = scale.z = 1 / (1 + stretch * 0.5)` (volume-preserving squash)
- Angle → `rotation.z` of the inner stretch group

The angle is **rate-limited** (`MAX_ANGULAR_STEP = 0.004`) and the magnitude has a **dead zone** (0.05) so jitter and tiny mouse moves don't make the blob spin. Slow idle drift via `sin/cos` of time so it never sits perfectly still.

The two-group structure is important:

- Outer `groupRef` — handles position + slow rotation
- Inner `stretchRef` — handles squash/stretch only
- Innermost `mesh` — holds the deformed geometry at `scale: 0.95`

## Click ripples

On `pointerdown`:

- Cast a ray from the camera through the click point
- Intersect a sphere at the blob's world position (radius 1.7)
- Convert the hit to local space, **normalize** it → that's the ripple's origin direction on the unit sphere
- Push `{x, y, z, start: t}` into `impulses` (capped at 4 active)

In the vertex loop, each impulse contributes:

- `dot = vertex · impulseDir`, `d = acos(dot)` — geodesic distance over the sphere
- `localT = (t − start) − d * 0.18` — propagation delay so the wave **travels outward** at angular speed
- `env = exp(-localT * 1.15)` — exponential decay
- `osc = sin(localT * 6)` — oscillation
- `spatial = 1 / (1 + d * 0.45)` — falloff with angular distance
- Lifetime ~5 s, then cleaned up

## Morphing into objects

5 target shapes defined by **signed distance functions (SDFs)** composed of primitives:

| Shape | Primitives |
|---|---|
| `laptop` (iMac) | display box + neck + foot |
| `camera` | body box + lens cylinder + lens rim + top + shutter |
| `pen` | barrel + tip + cap (capsules) + clip box |
| `book` | two rotated covers + page slabs (V-shape) |
| `fuji` | stacked tier boxes + slope capsules + peak |

SDF helpers: `sdBox`, `sdCylZ`, `sdCapsule`. Composite shape = `Math.min(...primitives)` (union).

### Building the morph target (`findFarR`)

The `findFarR` function does a **ray-from-origin march**:

1. For each base vertex direction `(dx, dy, dz)` (normalized)
2. Walk outward in steps of 0.015 from r=0.02 to r=1.8
3. Track the **farthest** r where SDF ≤ 0 (still inside the solid)
4. Place the morph target vertex at `direction * r`

This requires **the origin to be inside the main mass** — the comments call this out explicitly. Authoring composite shapes so origin is enclosed produces clean silhouettes (otherwise outer features get missed).

### Async build, off the main paint

Computing 5 shapes × thousands of verts × ~120 march steps would jank the page. So:

- Built incrementally in `requestAnimationFrame` chunks
- `FRAME_BUDGET_MS = 5`, `VERTS_PER_CHUNK = 40`
- Targets become available progressively; `morphKey.current` falls back to `'base'` if the target isn't built yet

### Trigger + tween

- `morphStore` is a tiny pub-sub holding the current shape key. Other components (links/buttons) call `morphStore.set('camera')` etc.
- Each frame: if the store key changed, ease `morphT` back to 0; once near 0, swap key and start easing back up to 1. This produces a "deflate to base, re-inflate to new shape" transition.
- On a swap, `morphBounceStart` is set so the next ~0.8 s adds `sin(τ*14) * exp(-τ*5) * 0.04 * m` — a damped jelly bounce

### Noise damping at full morph

`NOISE_DAMP_AT_T1` reduces noise amplitude as `m → 1`:

```js
noiseAmt = 0.32 * (1 - m * dampK)
```

Pure sphere needs full noise (organic blob); recognizable objects need crisp silhouettes (laptop = 0.99, fuji = 0.99, pen/book = 0.95, camera = 0.92).

## Layout / placement

- Canvas is `position: fixed; inset: 0; pointer-events: none; z-index: 10` — full-screen overlay that doesn't block clicks
- Blob anchored at `(-viewport.width * 0.30, viewport.height * 0.02)` — left of center
- Camera at `[0, 0, 5]`, FOV 40

## Lighting

- Ambient 0.7 + directional 0.9 (front-right) + directional 0.3 (back-left fill)
- Mostly there to define edge highlights since transmission does most of the visual work

## Design tradeoffs worth knowing for a constructor

- **Icosahedron over sphere** — uniform triangle distribution avoids pinching at poles when deforming
- **Per-vertex radial scaling** (multiply by `f`) rather than displacement along normals — cheaper and gives a coherent "breathing" feel
- **Two-stage lerp + dead zone + angular rate limit** is what makes the follow feel *alive* instead of mechanical or jittery
- **DOM-snapshot background** is what makes the glass look photorealistic; without it, transmission renders gray
- **SDF + ray-from-origin** is the trick for converting arbitrary 3D shapes into morph targets that share the icosahedron's vertex count and topology — required for a continuous tween
- **`NOISE_DAMP_AT_T1` table** trades noise vs. recognizability per shape — generic blobs benefit from more, specific shapes from less

## Parameters a constructor would expose

Geometry / mesh:
- icosahedron detail level (default 18)
- mesh scale (default 0.95)
- anchor position (viewport-relative)

Material (MeshTransmissionMaterial):
- transmission, ior, thickness
- chromaticAberration
- roughness
- distortion, distortionScale, temporalDistortion
- attenuationDistance, attenuationColor
- whether to use DOM snapshot as background

Noise:
- base noise amplitude (default 0.32)
- low-freq scale + time speed (0.75, 0.07)
- high-freq scale + time speed (1.8, 0.12) and weight (0.08)
- trail-bias weight (0.45) and pull magnitude clamp (1.8)

Cursor follow:
- target lerp rate (0.018)
- current lerp rate (0.012)
- stretch coefficient k (1.9), max stretch (1.15)
- dead zone (0.05), max angular step (0.004)
- idle drift amplitudes/frequencies

Click ripples:
- enabled / disabled
- max active (4), lifetime (~5 s)
- propagation speed (0.18), oscillation freq (6.0)
- decay rate (1.15), spatial falloff (0.45), amplitude (0.55)
- hit sphere radius (1.7)

Morph:
- list of `{name, sdf}` shape definitions
- per-shape noise damp value
- morph easing rate in/out (0.10 / 0.09)
- bounce amplitude (0.04), frequency (14), decay (5), duration (0.8)
- async build budget (5 ms / 40 verts)
- march STEP (0.015), range (0.02 → 1.8)

Lighting:
- ambient + directional intensities/positions

Layout:
- canvas zIndex, pointerEvents
- camera position, fov
