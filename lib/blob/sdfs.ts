import type { ShapeKey } from './types';

// SDF primitives — return signed distance (negative = inside)
export const sdBox = (
  px: number, py: number, pz: number,
  cx: number, cy: number, cz: number,
  hx: number, hy: number, hz: number,
): number => {
  const dx = Math.abs(px - cx) - hx;
  const dy = Math.abs(py - cy) - hy;
  const dz = Math.abs(pz - cz) - hz;
  const ax = Math.max(dx, 0), ay = Math.max(dy, 0), az = Math.max(dz, 0);
  const outside = Math.sqrt(ax * ax + ay * ay + az * az);
  const inside = Math.min(Math.max(dx, Math.max(dy, dz)), 0);
  return outside + inside;
};

export const sdCylZ = (
  px: number, py: number, pz: number,
  cx: number, cy: number, cz: number,
  r: number, hz: number,
): number => {
  const radial = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) - r;
  const axial = Math.abs(pz - cz) - hz;
  const outside = Math.sqrt(Math.max(radial, 0) ** 2 + Math.max(axial, 0) ** 2);
  const inside = Math.min(Math.max(radial, axial), 0);
  return outside + inside;
};

export const sdCapsule = (
  px: number, py: number, pz: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  r: number,
): number => {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const dot = pax * bax + pay * bay + paz * baz;
  const lenSq = bax * bax + bay * bay + baz * baz;
  const h = Math.max(0, Math.min(1, dot / lenSq));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
};

type SdfFn = (x: number, y: number, z: number) => number;

const laptop: SdfFn = (x, y, z) => Math.min(
  sdBox(x, y, z, 0, 0.25, 0, 0.65, 0.40, 0.05),       // display
  sdBox(x, y, z, 0, -0.20, 0.02, 0.05, 0.20, 0.04),    // neck
  sdBox(x, y, z, 0, -0.45, 0.10, 0.45, 0.04, 0.30),    // foot
);

const camera: SdfFn = (x, y, z) => Math.min(
  sdBox(x, y, z, 0, 0, 0, 0.55, 0.32, 0.20),           // body
  sdCylZ(x, y, z, 0, 0, 0.18, 0.22, 0.18),             // lens
  sdCylZ(x, y, z, 0, 0, 0.36, 0.24, 0.04),             // lens rim
  sdBox(x, y, z, 0.25, 0.36, 0, 0.18, 0.06, 0.18),     // top hump (viewfinder)
  sdBox(x, y, z, 0.42, 0.04, 0.18, 0.05, 0.05, 0.02),  // shutter
);

const pen: SdfFn = (x, y, z) => Math.min(
  sdCapsule(x, y, z, -0.55, 0, 0, 0.40, 0, 0, 0.08),   // barrel
  sdCapsule(x, y, z, 0.40, 0, 0, 0.62, 0, 0, 0.04),    // tip
  sdCapsule(x, y, z, -0.55, 0, 0, -0.70, 0, 0, 0.075), // cap
  sdBox(x, y, z, -0.62, 0.10, 0, 0.04, 0.18, 0.02),    // clip
);

const book: SdfFn = (x, y, z) => {
  // V-shape: two covers tilted, page slabs between
  const tilt = 0.25;
  // left cover
  const lx = x * Math.cos(tilt) + y * Math.sin(tilt);
  const ly = -x * Math.sin(tilt) + y * Math.cos(tilt);
  const left = sdBox(lx, ly, z, -0.30, 0, 0, 0.30, 0.40, 0.04);
  // right cover
  const rx = x * Math.cos(-tilt) + y * Math.sin(-tilt);
  const ry = -x * Math.sin(-tilt) + y * Math.cos(-tilt);
  const right = sdBox(rx, ry, z, 0.30, 0, 0, 0.30, 0.40, 0.04);
  // pages (slimmer)
  const pages = sdBox(x, y, z, 0, 0.02, 0, 0.55, 0.36, 0.06);
  return Math.min(left, right, pages);
};

const fuji: SdfFn = (x, y, z) => Math.min(
  sdBox(x, y, z, 0, -0.40, 0, 0.65, 0.10, 0.65),       // base tier
  sdBox(x, y, z, 0, -0.20, 0, 0.50, 0.10, 0.50),       // mid tier
  sdBox(x, y, z, 0, 0.00, 0, 0.32, 0.10, 0.32),        // upper tier
  sdCapsule(x, y, z, -0.45, -0.50, 0, 0, 0.20, 0, 0.10),  // left slope
  sdCapsule(x, y, z, 0.45, -0.50, 0, 0, 0.20, 0, 0.10),   // right slope
  sdBox(x, y, z, 0, 0.20, 0, 0.10, 0.10, 0.10),        // peak
);

export const shapeSdfs: Record<Exclude<ShapeKey, 'base'>, SdfFn> = {
  laptop,
  camera,
  pen,
  book,
  fuji,
};

// Ray-from-origin march: for each direction, find farthest r where sdf <= 0
export const findFarR = (
  sdf: SdfFn,
  dx: number, dy: number, dz: number,
  step = 0.015, rMin = 0.02, rMax = 1.8,
): number => {
  let best = rMin;
  for (let r = rMin; r <= rMax; r += step) {
    const d = sdf(dx * r, dy * r, dz * r);
    if (d <= 0) best = r;
  }
  return best;
};
