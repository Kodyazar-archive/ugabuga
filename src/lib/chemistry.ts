import { elementOf } from './element-data';

export interface Atom {
  id: string;
  element: string;
  /** Position in Ångström */
  position: [number, number, number];
}

export interface Bond {
  id: string;
  a: string;
  b: string;
  order: 1 | 2 | 3;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
}

export type BondPolarity = 'nonpolar-covalent' | 'polar-covalent' | 'ionic';

export interface BondAnalysis {
  polarity: BondPolarity;
  deltaEn: number;
  length: number;
}

/** Two atoms are considered bonded when closer than 1.35× the sum of covalent radii. */
export const BOND_FACTOR = 1.35;

export function distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function bondLengthFor(symA: string, symB: string): number {
  return elementOf(symA).covalentRadius + elementOf(symB).covalentRadius;
}

export function maxBondDistance(symA: string, symB: string): number {
  return bondLengthFor(symA, symB) * BOND_FACTOR;
}

export function canBond(atomA: Atom, atomB: Atom): boolean {
  return distance(atomA.position, atomB.position) <= maxBondDistance(atomA.element, atomB.element);
}

export function analyzeBond(atomA: Atom, atomB: Atom): BondAnalysis {
  const enA = elementOf(atomA.element).electronegativity;
  const enB = elementOf(atomB.element).electronegativity;
  const deltaEn = Math.abs(enA - enB);
  let polarity: BondPolarity = 'nonpolar-covalent';
  if (deltaEn >= 1.7) polarity = 'ionic';
  else if (deltaEn >= 0.4) polarity = 'polar-covalent';
  return { polarity, deltaEn, length: distance(atomA.position, atomB.position) };
}

/** Hill notation: C first, H second, rest alphabetically (no carbon: all alphabetical). */
export function molecularFormula(molecule: Molecule): string {
  const counts = new Map<string, number>();
  for (const atom of molecule.atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  }
  const ordered: string[] = [];
  if (counts.has('C')) {
    ordered.push('C');
    if (counts.has('H')) ordered.push('H');
    ordered.push(...[...counts.keys()].filter((k) => k !== 'C' && k !== 'H').sort());
  } else {
    ordered.push(...[...counts.keys()].sort());
  }
  return ordered
    .map((sym) => {
      const n = counts.get(sym) ?? 0;
      return n > 1 ? `${sym}${n}` : sym;
    })
    .join('');
}

/** Parsed formula segments so the UI can render proper subscripts. */
export function formulaSegments(formula: string): Array<{ text: string; sub: boolean }> {
  const segments: Array<{ text: string; sub: boolean }> = [];
  for (const char of formula) {
    const isDigit = char >= '0' && char <= '9';
    const last = segments[segments.length - 1];
    if (last && last.sub === isDigit) last.text += char;
    else segments.push({ text: char, sub: isDigit });
  }
  return segments;
}

export function molarMass(molecule: Molecule): number {
  return molecule.atoms.reduce((sum, atom) => sum + elementOf(atom.element).mass, 0);
}

export function centroid(molecule: Molecule): [number, number, number] {
  if (molecule.atoms.length === 0) return [0, 0, 0];
  const sum: [number, number, number] = [0, 0, 0];
  for (const atom of molecule.atoms) {
    sum[0] += atom.position[0];
    sum[1] += atom.position[1];
    sum[2] += atom.position[2];
  }
  const n = molecule.atoms.length;
  return [sum[0] / n, sum[1] / n, sum[2] / n];
}

export function radiusOfGyration(molecule: Molecule): number {
  const c = centroid(molecule);
  if (molecule.atoms.length === 0) return 0;
  const total = molecule.atoms.reduce((sum, atom) => sum + distance(atom.position, c) ** 2, 0);
  return Math.sqrt(total / molecule.atoms.length);
}

/** Bond angle A-B-C in degrees, with the vertex at B. */
export function bondAngle(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
): number {
  const v1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const n1 = Math.hypot(v1[0], v1[1], v1[2]);
  const n2 = Math.hypot(v2[0], v2[1], v2[2]);
  if (n1 === 0 || n2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, (v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** XYZ file format: atom count, comment line, then `element x y z` rows. */
export function exportXYZ(molecule: Molecule): string {
  const lines = [String(molecule.atoms.length), molecularFormula(molecule) || 'molecule'];
  for (const atom of molecule.atoms) {
    lines.push(`${atom.element} ${atom.position.map((n) => n.toFixed(4)).join(' ')}`);
  }
  return `${lines.join('\n')}\n`;
}
export interface DipoleResult {
  vector: [number, number, number];
  magnitude: number;
  isPolar: boolean;
}

/** Molecules with μ above this (crude EN-weighted units) count as polar. */
export const DIPOLE_POLAR_THRESHOLD = 0.25;

/**
 * Crude dipole estimate: partial charge qi = ENi − meanEN,
 * μ = Σ qi·(ri − centroid). Good enough to separate H₂O from CO₂.
 */
export function netDipole(molecule: Molecule): DipoleResult {
  if (molecule.atoms.length === 0) return { vector: [0, 0, 0], magnitude: 0, isPolar: false };
  const c = centroid(molecule);
  const meanEn = molecule.atoms.reduce((s, a) => s + elementOf(a.element).electronegativity, 0) / molecule.atoms.length;
  const vector: [number, number, number] = [0, 0, 0];
  for (const atom of molecule.atoms) {
    const q = elementOf(atom.element).electronegativity - meanEn;
    vector[0] += q * (atom.position[0] - c[0]);
    vector[1] += q * (atom.position[1] - c[1]);
    vector[2] += q * (atom.position[2] - c[2]);
  }
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  return { vector, magnitude, isPolar: magnitude >= DIPOLE_POLAR_THRESHOLD };
}

/** Detects bonds geometrically — used by presets and auto-bonding in the editor. */
export function detectBonds(atoms: Atom[], orderFor?: (a: Atom, b: Atom) => 1 | 2 | 3): Bond[] {
  const bonds: Bond[] = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      if (canBond(atoms[i], atoms[j])) {
        bonds.push({
          id: `bond-${atoms[i].id}-${atoms[j].id}`,
          a: atoms[i].id,
          b: atoms[j].id,
          order: orderFor ? orderFor(atoms[i], atoms[j]) : 1,
        });
      }
    }
  }
  return bonds;
}
