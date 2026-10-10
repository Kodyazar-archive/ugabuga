import type { Atom, Bond, Molecule } from './chemistry';
import { detectBonds } from './chemistry';

export interface PresetSpec {
  id: string;
  name: string;
  description: string;
  /** [symbol, x, y, z] in Ångström */
  coords: Array<[string, number, number, number]>;
  /** Optional explicit bonds by atom index [iA, iB, order]; geometric detection when omitted */
  bonds?: Array<[number, number, 1 | 2 | 3]>;
}

export const PRESETS: PresetSpec[] = [
  {
    id: 'water',
    name: 'Water',
    description: 'H₂O — bent geometry, 104.5° bond angle. The universal solvent.',
    coords: [
      ['O', 0, 0, 0],
      ['H', 0.757, 0.586, 0],
      ['H', -0.757, 0.586, 0],
    ],
  },
  {
    id: 'carbon-dioxide',
    name: 'Carbon Dioxide',
    description: 'CO₂ — linear molecule with two polar C=O double bonds.',
    coords: [
      ['C', 0, 0, 0],
      ['O', 1.16, 0, 0],
      ['O', -1.16, 0, 0],
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
    ],
  },
  {
    id: 'oxygen',
    name: 'Oxygen Gas',
    description: 'O₂ — diatomic, held by a double bond. 21% of the atmosphere.',
    coords: [
      ['O', 0.605, 0, 0],
      ['O', -0.605, 0, 0],
    ],
    bonds: [[0, 1, 2]],
  },
  {
    id: 'nitrogen',
    name: 'Nitrogen Gas',
    description: 'N₂ — one of the strongest bonds in chemistry (945 kJ/mol).',
    coords: [
      ['N', 0.549, 0, 0],
      ['N', -0.549, 0, 0],
    ],
    bonds: [[0, 1, 3]],
  },
  {
    id: 'hydrogen-fluoride',
    name: 'Hydrogen Fluoride',
    description: 'HF — extremely polar covalent bond (ΔEN = 1.78).',
    coords: [
      ['H', 0, 0, 0],
      ['F', 0.917, 0, 0],
    ],
  },
  {
    id: 'methane',
    name: 'Methane',
    description: 'CH₄ — perfect tetrahedron, 109.5° angles. Simplest alkane.',
    coords: [
      ['C', 0, 0, 0],
      ['H', 0.629, 0.629, 0.629],
      ['H', -0.629, -0.629, 0.629],
      ['H', -0.629, 0.629, -0.629],
      ['H', 0.629, -0.629, -0.629],
    ],
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    description: 'NH₃ — trigonal pyramidal; the lone pair pushes bonds to 107°.',
    coords: [
      ['N', 0, 0, 0],
      ['H', 0.938, -0.281, 0],
      ['H', -0.469, -0.281, 0.812],
      ['H', -0.469, -0.281, -0.812],
    ],
  },
  {
    id: 'ethene',
    name: 'Ethene',
    description: 'C₂H₄ — planar, sp² carbons. Feedstock of polyethylene.',
    coords: [
      ['C', 0.665, 0, 0],
      ['C', -0.665, 0, 0],
      ['H', 1.221, 0.926, 0],
      ['H', 1.221, -0.926, 0],
      ['H', -1.221, 0.926, 0],
      ['H', -1.221, -0.926, 0],
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 1],
      [1, 4, 1],
      [1, 5, 1],
    ],
  },
  {
    id: 'ethyne',
    name: 'Ethyne',
    description: 'C₂H₂ — acetylene. Linear sp carbons joined by a C≡C triple bond.',
    coords: [
      ['C', 0.6, 0, 0],
      ['C', -0.6, 0, 0],
      ['H', 1.66, 0, 0],
      ['H', -1.66, 0, 0],
    ],
    bonds: [
      [0, 1, 3],
      [0, 2, 1],
      [1, 3, 1],
    ],
  },
  {
    id: 'benzene',
    name: 'Benzene',
    description: 'C₆H₆ — aromatic ring with delocalized π electrons (Kekulé form shown).',
    coords: [
      ['C', 1.39, 0, 0],
      ['C', 0.695, 1.204, 0],
      ['C', -0.695, 1.204, 0],
      ['C', -1.39, 0, 0],
      ['C', -0.695, -1.204, 0],
      ['C', 0.695, -1.204, 0],
      ['H', 2.47, 0, 0],
      ['H', 1.235, 2.14, 0],
      ['H', -1.235, 2.14, 0],
      ['H', -2.47, 0, 0],
      ['H', -1.235, -2.14, 0],
      ['H', 1.235, -2.14, 0],
    ],
    bonds: [
      [0, 1, 2],
      [1, 2, 1],
      [2, 3, 2],
      [3, 4, 1],
      [4, 5, 2],
      [5, 0, 1],
      [0, 6, 1],
      [1, 7, 1],
      [2, 8, 1],
      [3, 9, 1],
      [4, 10, 1],
      [5, 11, 1],
    ],
  },
  {
    id: 'methanol',
    name: 'Methanol',
    description: 'CH₃OH — simplest alcohol. Wood spirit.',
    coords: [
      ['C', 0, 0, 0],
      ['O', 1.43, 0, 0],
      ['H', 1.67, 0.93, 0],
      ['H', -0.363, 1.028, 0],
      ['H', -0.363, -0.514, 0.889],
      ['H', -0.363, -0.514, -0.889],
    ],
  },
  {
    id: 'ethanol',
    name: 'Ethanol',
    description: 'C₂H₅OH — the drinking alcohol. Tetrahedral sp³ backbone.',
    coords: [
      ['C', 0, 0, 0],
      ['C', 1.52, 0, 0],
      ['O', 1.998, -1.344, 0],
      ['H', 1.68, -1.58, 0.88],
      ['H', -0.363, 1.028, 0],
      ['H', -0.363, -0.514, 0.889],
      ['H', -0.363, -0.514, -0.889],
      ['H', 1.883, 0.512, 0.891],
      ['H', 1.883, 0.512, -0.891],
    ],
  },
];

export function presetToMolecule(spec: PresetSpec): Molecule {
  const atoms: Atom[] = spec.coords.map(([element, x, y, z], i) => ({
    id: `atom-${i}`,
    element,
    position: [x, y, z],
  }));
  let bonds: Bond[];
  if (spec.bonds) {
    bonds = spec.bonds.map(([ia, ib, order]) => ({
      id: `bond-${atoms[ia].id}-${atoms[ib].id}`,
      a: atoms[ia].id,
      b: atoms[ib].id,
      order,
    }));
  } else {
    bonds = detectBonds(atoms);
  }
  return { atoms, bonds };
}

export function findPreset(id: string): PresetSpec {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Truncated icosahedron (C₆₀): start from an icosahedron of edge 2,
 * cut every edge at 1/3 from each end (30 edges × 2 = 60 vertices),
 * then scale so C–C bonds land at 1.44 Å.
 */
function buckyballCoords(): Array<[string, number, number, number]> {
  const ico: Array<[number, number, number]> = [];
  for (const [sa, sb] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as Array<[number, number]>) {
    ico.push([0, sa * 1, sb * PHI], [sa * 1, sb * PHI, 0], [sb * PHI, 0, sa * 1]);
  }
  const vertices: Array<[number, number, number]> = [];
  for (let i = 0; i < ico.length; i++) {
    for (let j = i + 1; j < ico.length; j++) {
      const [ux, uy, uz] = ico[i];
      const [vx, vy, vz] = ico[j];
      const d2 = (ux - vx) ** 2 + (uy - vy) ** 2 + (uz - vz) ** 2;
      if (Math.abs(d2 - 4) > 1e-6) continue; // not an icosahedron edge
      vertices.push(
        [(2 * ux + vx) / 3, (2 * uy + vy) / 3, (2 * uz + vz) / 3],
        [(ux + 2 * vx) / 3, (uy + 2 * vy) / 3, (uz + 2 * vz) / 3],
      );
    }
  }
  const scale = 1.44 / (2 / 3); // truncated edge length is 2/3
  return vertices.map(([x, y, z]) => ['C', x * scale, y * scale, z * scale] as [string, number, number, number]);
}

export const BUCKYBALL: PresetSpec = {
  id: 'buckyball',
  name: 'Buckminsterfullerene',
  description: 'C₆₀ — 60 carbons in a truncated icosahedron. Bonds detected geometrically.',
  coords: buckyballCoords(),
};

PRESETS.push(BUCKYBALL);

export const EMPTY_MOLECULE: Molecule = { atoms: [], bonds: [] };
