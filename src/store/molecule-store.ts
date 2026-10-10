import { create } from 'zustand';

import type { Atom, Bond, Molecule } from '../lib/chemistry';
import { canBond, detectBonds } from '../lib/chemistry';
import { findPreset, presetToMolecule } from '../lib/molecule-library';

export type Tool = 'select' | 'add' | 'bond' | 'delete';
export type DisplayMode = 'ball-stick' | 'space-filling' | 'wireframe';
export type Selection = { kind: 'atom' | 'bond'; id: string } | null;

interface HistoryEntry {
  atoms: Atom[];
  bonds: Bond[];
}

interface MoleculeState extends HistoryEntry {
  tool: Tool;
  displayMode: DisplayMode;
  selectedElement: string;
  selection: Selection;
  showLabels: boolean;
  autoRotate: boolean;
  vibrating: boolean;
  atomScale: number;
  bondScale: number;
  showDipole: boolean;
  bondPendingId: string | null;
  dragging: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  activePresetId: string | null;
  dirty: boolean;

  setTool: (tool: Tool) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setSelectedElement: (symbol: string) => void;
  select: (selection: Selection) => void;
  toggleLabels: () => void;
  toggleAutoRotate: () => void;
  toggleVibrating: () => void;
  setAtomScale: (scale: number) => void;
  setBondScale: (scale: number) => void;
  toggleDipole: () => void;
  loadPreset: (id: string) => void;
  loadMolecule: (molecule: Molecule) => void;
  clearAll: () => void;
  addAtom: (position: [number, number, number], element?: string) => void;
  moveAtom: (id: string, position: [number, number, number], commit: boolean) => void;
  deleteAtom: (id: string) => void;
  deleteBond: (id: string) => void;
  requestBond: (atomId: string) => void;
  cancelBondRequest: () => void;
  setDragging: (dragging: boolean) => void;
  cycleBondOrder: (id: string) => void;
  undo: () => void;
  redo: () => void;
  autoBond: () => void;
}

const MAX_HISTORY = 50;

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/** Appends a state entry to history, truncating the redo tail and capping size. */
function withHistory(s: MoleculeState, entry: HistoryEntry): Pick<MoleculeState, 'history' | 'historyIndex'> {
  const base = s.history.slice(0, s.historyIndex + 1);
  const history = [...base, entry];
  const trimmed = history.slice(-MAX_HISTORY);
  return { history: trimmed, historyIndex: trimmed.length - 1 };
}

const initial = presetToMolecule(findPreset('water'));

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  atoms: initial.atoms,
  bonds: initial.bonds,
  history: [{ atoms: initial.atoms, bonds: initial.bonds }],
  historyIndex: 0,
  activePresetId: 'water',
  tool: 'select',
  displayMode: 'ball-stick',
  selectedElement: 'C',
  selection: null,
  showLabels: true,
  autoRotate: false,
  vibrating: false,
  atomScale: 1,
  bondScale: 1,
  showDipole: true,
  bondPendingId: null,
  dragging: false,
  dirty: false,

  setTool: (tool) => set({ tool, bondPendingId: null }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  select: (selection) => set({ selection }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleVibrating: () => set((s) => ({ vibrating: !s.vibrating })),
  setAtomScale: (scale) => set({ atomScale: Math.min(1.8, Math.max(0.4, scale)) }),
  setBondScale: (scale) => set({ bondScale: Math.min(1.8, Math.max(0.4, scale)) }),
  toggleDipole: () => set((s) => ({ showDipole: !s.showDipole })),

  loadPreset: (id) => {
    const mol = presetToMolecule(findPreset(id));
    set((s) => ({
      atoms: mol.atoms,
      bonds: mol.bonds,
      selection: null,
      bondPendingId: null,
      activePresetId: id,
      dirty: false,
      ...withHistory(s, { atoms: mol.atoms, bonds: mol.bonds }),
    }));
  },

  loadMolecule: (molecule) => {
    set((s) => ({
      atoms: molecule.atoms,
      bonds: molecule.bonds,
      selection: null,
      bondPendingId: null,
      activePresetId: null,
      dirty: true,
      ...withHistory(s, { atoms: molecule.atoms, bonds: molecule.bonds }),
    }));
  },

  clearAll: () =>
    set((s) => ({
      atoms: [],
      bonds: [],
      selection: null,
      bondPendingId: null,
      activePresetId: null,
      dirty: true,
      ...withHistory(s, { atoms: [], bonds: [] }),
    })),

  addAtom: (position, element) => {
    const sym = element ?? get().selectedElement;
    const atom: Atom = { id: nextId('atom'), element: sym, position };
    set((s) => {
      const atoms = [...s.atoms, atom];
      // Auto-bond the newcomer to anything within covalent reach.
      const fresh = detectBonds(atoms).filter((nb) => !s.bonds.some((b) => b.id === nb.id));
      const entry = { atoms, bonds: [...s.bonds, ...fresh] };
      return {
        ...entry,
        selection: { kind: 'atom', id: atom.id },
        activePresetId: null,
        dirty: true,
        ...withHistory(s, entry),
      };
    });
  },

  moveAtom: (id, position, commit) => {
    set((s) => {
      const atoms = s.atoms.map((a) => (a.id === id ? { ...a, position } : a));
      if (!commit) return { atoms, activePresetId: null, dirty: true };
      return {
        atoms,
        activePresetId: null,
        dirty: true,
        ...withHistory(s, { atoms, bonds: s.bonds }),
      };
    });
  },

  deleteAtom: (id) => {
    set((s) => {
      const entry = {
        atoms: s.atoms.filter((a) => a.id !== id),
        bonds: s.bonds.filter((b) => b.a !== id && b.b !== id),
      };
      return {
        ...entry,
        selection: null,
        activePresetId: null,
        dirty: true,
        ...withHistory(s, entry),
      };
    });
  },

  deleteBond: (id) => {
    set((s) => {
      const entry = { atoms: s.atoms, bonds: s.bonds.filter((b) => b.id !== id) };
      return {
        ...entry,
        selection: null,
        activePresetId: null,
        dirty: true,
        ...withHistory(s, entry),
      };
    });
  },

  requestBond: (atomId) => {
    const s = get();
    if (!s.bondPendingId) {
      set({ bondPendingId: atomId, selection: { kind: 'atom', id: atomId } });
      return;
    }
    if (s.bondPendingId === atomId) {
      set({ bondPendingId: null });
      return;
    }
    const atomA = s.atoms.find((a) => a.id === s.bondPendingId);
    const atomB = s.atoms.find((a) => a.id === atomId);
    if (!atomA || !atomB) {
      set({ bondPendingId: null });
      return;
    }
    const exists = s.bonds.some(
      (b) => (b.a === atomA.id && b.b === atomB.id) || (b.a === atomB.id && b.b === atomA.id),
    );
    if (exists || !canBond(atomA, atomB)) {
      // Out of reach or already bonded — restart the gesture on this atom instead.
      set({ bondPendingId: atomId, selection: { kind: 'atom', id: atomId } });
      return;
    }
    const bond: Bond = { id: `bond-${atomA.id}-${atomB.id}`, a: atomA.id, b: atomB.id, order: 1 };
    const entry = { atoms: s.atoms, bonds: [...s.bonds, bond] };
    set((prev) => ({
      ...entry,
      bondPendingId: null,
      selection: { kind: 'bond', id: bond.id },
      activePresetId: null,
      dirty: true,
      ...withHistory(prev, entry),
    }));
  },

  cancelBondRequest: () => set({ bondPendingId: null }),
  setDragging: (dragging) => set({ dragging }),

  cycleBondOrder: (id) => {
    set((s) => {
      const entry = {
        atoms: s.atoms,
        bonds: s.bonds.map((b) => (b.id === id ? { ...b, order: ((b.order % 3) + 1) as 1 | 2 | 3 } : b)),
      };
      return { dirty: true, ...entry, ...withHistory(s, entry) };
    });
  },

  undo: () => {
    const s = get();
    if (s.historyIndex <= 0) return;
    const historyIndex = s.historyIndex - 1;
    const entry = s.history[historyIndex];
    set({ atoms: entry.atoms, bonds: entry.bonds, historyIndex, selection: null });
  },

  redo: () => {
    const s = get();
    if (s.historyIndex >= s.history.length - 1) return;
    const historyIndex = s.historyIndex + 1;
    const entry = s.history[historyIndex];
    set({ atoms: entry.atoms, bonds: entry.bonds, historyIndex, selection: null });
  },

  autoBond: () => {
    set((s) => {
      const entry = { atoms: s.atoms, bonds: detectBonds(s.atoms) };
      return { ...entry, ...withHistory(s, entry) };
    });
  },
}));

export type { Molecule };
