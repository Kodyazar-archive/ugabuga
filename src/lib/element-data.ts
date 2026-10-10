export interface ElementInfo {
  symbol: string;
  name: string;
  atomicNumber: number;
  mass: number;
  /** Covalent radius in Ångström */
  covalentRadius: number;
  /** Van der Waals radius in Ångström */
  vdwRadius: number;
  /** CPK display color */
  color: string;
  electronegativity: number;
  category: string;
  electronConfig: string;
  phase: string;
}

export const ELEMENTS: Record<string, ElementInfo> = {
  H: {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    mass: 1.008,
    covalentRadius: 0.31,
    vdwRadius: 1.2,
    color: '#f2f5f8',
    electronegativity: 2.2,
    category: 'Nonmetal',
    electronConfig: '1s¹',
    phase: 'Gas',
  },
  B: {
    symbol: 'B',
    name: 'Boron',
    atomicNumber: 5,
    mass: 10.81,
    covalentRadius: 0.84,
    vdwRadius: 1.92,
    color: '#ffb5b5',
    electronegativity: 2.04,
    category: 'Metalloid',
    electronConfig: '[He] 2s² 2p¹',
    phase: 'Solid',
  },
  C: {
    symbol: 'C',
    name: 'Carbon',
    atomicNumber: 6,
    mass: 12.011,
    covalentRadius: 0.76,
    vdwRadius: 1.7,
    color: '#7d8a99',
    electronegativity: 2.55,
    category: 'Nonmetal',
    electronConfig: '[He] 2s² 2p²',
    phase: 'Solid',
  },
  N: {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    mass: 14.007,
    covalentRadius: 0.71,
    vdwRadius: 1.55,
    color: '#4f7cff',
    electronegativity: 3.04,
    category: 'Nonmetal',
    electronConfig: '[He] 2s² 2p³',
    phase: 'Gas',
  },
  O: {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    mass: 15.999,
    covalentRadius: 0.66,
    vdwRadius: 1.52,
    color: '#ff4538',
    electronegativity: 3.44,
    category: 'Nonmetal',
    electronConfig: '[He] 2s² 2p⁴',
    phase: 'Gas',
  },
  F: {
    symbol: 'F',
    name: 'Fluorine',
    atomicNumber: 9,
    mass: 18.998,
    covalentRadius: 0.57,
    vdwRadius: 1.47,
    color: '#90e050',
    electronegativity: 3.98,
    category: 'Halogen',
    electronConfig: '[He] 2s² 2p⁵',
    phase: 'Gas',
  },
  Na: {
    symbol: 'Na',
    name: 'Sodium',
    atomicNumber: 11,
    mass: 22.99,
    covalentRadius: 1.66,
    vdwRadius: 2.27,
    color: '#ab5cf2',
    electronegativity: 0.93,
    category: 'Alkali metal',
    electronConfig: '[Ne] 3s¹',
    phase: 'Solid',
  },
  Si: {
    symbol: 'Si',
    name: 'Silicon',
    atomicNumber: 14,
    mass: 28.085,
    covalentRadius: 1.11,
    vdwRadius: 2.1,
    color: '#f0c8a0',
    electronegativity: 1.9,
    category: 'Metalloid',
    electronConfig: '[Ne] 3s² 3p²',
    phase: 'Solid',
  },
  P: {
    symbol: 'P',
    name: 'Phosphorus',
    atomicNumber: 15,
    mass: 30.974,
    covalentRadius: 1.07,
    vdwRadius: 1.8,
    color: '#ff9a3c',
    electronegativity: 2.19,
    category: 'Nonmetal',
    electronConfig: '[Ne] 3s² 3p³',
    phase: 'Solid',
  },
  S: {
    symbol: 'S',
    name: 'Sulfur',
    atomicNumber: 16,
    mass: 32.06,
    covalentRadius: 1.05,
    vdwRadius: 1.8,
    color: '#ffe135',
    electronegativity: 2.58,
    category: 'Nonmetal',
    electronConfig: '[Ne] 3s² 3p⁴',
    phase: 'Solid',
  },
  Cl: {
    symbol: 'Cl',
    name: 'Chlorine',
    atomicNumber: 17,
    mass: 35.45,
    covalentRadius: 1.02,
    vdwRadius: 1.75,
    color: '#35e05a',
    electronegativity: 3.16,
    category: 'Halogen',
    electronConfig: '[Ne] 3s² 3p⁵',
    phase: 'Gas',
  },
  Br: {
    symbol: 'Br',
    name: 'Bromine',
    atomicNumber: 35,
    mass: 79.904,
    covalentRadius: 1.2,
    vdwRadius: 1.85,
    color: '#c7502e',
    electronegativity: 2.96,
    category: 'Halogen',
    electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵',
    phase: 'Liquid',
  },
  I: {
    symbol: 'I',
    name: 'Iodine',
    atomicNumber: 53,
    mass: 126.904,
    covalentRadius: 1.39,
    vdwRadius: 1.98,
    color: '#b04ddb',
    electronegativity: 2.66,
    category: 'Halogen',
    electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵',
    phase: 'Solid',
  },
};

/** Elements offered in the editor palette. */
export const PALETTE_ELEMENTS = Object.keys(ELEMENTS);

export function elementOf(symbol: string): ElementInfo {
  return ELEMENTS[symbol] ?? ELEMENTS.C;
}
