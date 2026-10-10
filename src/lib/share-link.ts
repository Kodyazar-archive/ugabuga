import { ELEMENTS } from './element-data';

import type { Molecule } from './chemistry';

/** Max atoms accepted from a shared link — keeps URL parsing cheap and safe. */
const MAX_SHARED_ATOMS = 500;

interface SharedBond {
  a: number;
  b: number;
  o: 1 | 2 | 3;
}

interface SharedPayload {
  v: 1;
  atoms: Array<[string, number, number, number]>;
  bonds: SharedBond[];
}

function isFiniteTuple(p: unknown): p is [number, number, number] {
  return (
    Array.isArray(p) &&
    p.length === 3 &&
    p.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1000)
  );
}

/** Encodes a molecule into a URL-safe base64 string for `#m=` sharing. */
export function encodeMolecule(molecule: Molecule): string {
  const indexOf = new Map(molecule.atoms.map((a, i) => [a.id, i]));
  const payload: SharedPayload = {
    v: 1,
    atoms: molecule.atoms.map((a) => [a.element, a.position[0], a.position[1], a.position[2]]),
    bonds: molecule.bonds.flatMap((b) => {
      const a = indexOf.get(b.a);
      const c = indexOf.get(b.b);
      return a === undefined || c === undefined ? [] : [{ a, b: c, o: b.order }];
    }),
  };
  return btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** Decodes a `#m=` string; returns null when malformed or unsafe. */
export function decodeMolecule(raw: string): Molecule | null {
  try {
    const normalized = raw.replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(atob(normalized)) as SharedPayload;
    if (payload.v !== 1 || !Array.isArray(payload.atoms) || payload.atoms.length > MAX_SHARED_ATOMS) {
      return null;
    }
    const atoms: Molecule['atoms'] = [];
    for (const [index, entry] of payload.atoms.entries()) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !(entry[0] in ELEMENTS)) return null;
      const position = entry.slice(1) as unknown;
      if (!isFiniteTuple(position)) return null;
      atoms.push({ id: `shared-${index}`, element: entry[0], position });
    }
    const bonds: Molecule['bonds'] = [];
    if (Array.isArray(payload.bonds)) {
      for (const bond of payload.bonds) {
        const { a, b, o } = bond;
        if (
          !Number.isInteger(a) ||
          !Number.isInteger(b) ||
          a < 0 ||
          b < 0 ||
          a >= atoms.length ||
          b >= atoms.length ||
          a === b ||
          (o !== 1 && o !== 2 && o !== 3)
        ) {
          continue;
        }
        bonds.push({ id: `shared-bond-${a}-${b}`, a: `shared-${a}`, b: `shared-${b}`, order: o });
      }
    }
    return { atoms, bonds };
  } catch {
    return null;
  }
}
