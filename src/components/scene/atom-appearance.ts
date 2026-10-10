import { elementOf } from '@/lib/element-data';

import type { DisplayMode } from '@/store/molecule-store';

/** Radius of an atom sphere for a display mode, times a user scale factor. */
export function atomRadius(symbol: string, mode: DisplayMode, scale = 1): number {
  const el = elementOf(symbol);
  if (mode === 'space-filling') return el.vdwRadius * scale;
  if (mode === 'wireframe') return 0.11 * scale;
  return Math.max(0.16, 0.38 * el.covalentRadius) * scale;
}

/** Radius of the cylinder drawn between two bonded atoms. */
export function bondTubeRadius(mode: DisplayMode, scale = 1): number {
  return (mode === 'space-filling' ? 0.07 : 0.09) * scale;
}

export function atomColor(symbol: string): string {
  return elementOf(symbol).color;
}

/** Perpendicular unit vectors used to offset double/triple bond tubes. */
export function perpendiculars(dir: [number, number, number]): {
  u: [number, number, number];
  v: [number, number, number];
} {
  const len = Math.hypot(...dir);
  const d: [number, number, number] = len > 1e-6 ? [dir[0] / len, dir[1] / len, dir[2] / len] : [0, 1, 0];
  // Arbitrary axis not parallel to d, then Gram-Schmidt style cross products.
  const axis: [number, number, number] = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u: [number, number, number] = [
    d[1] * axis[2] - d[2] * axis[1],
    d[2] * axis[0] - d[0] * axis[2],
    d[0] * axis[1] - d[1] * axis[0],
  ];
  const ul = Math.hypot(...u);
  u[0] /= ul;
  u[1] /= ul;
  u[2] /= ul;
  const v: [number, number, number] = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  return { u, v };
}
