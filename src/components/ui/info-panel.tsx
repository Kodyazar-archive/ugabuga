import { AtomIcon, Info, Link2, Sigma } from 'lucide-react';

import {
  analyzeBond,
  bondAngle,
  distance,
  molarMass,
  molecularFormula,
  netDipole,
  radiusOfGyration,
} from '@/lib/chemistry';
import { elementOf } from '@/lib/element-data';
import { useMoleculeStore } from '@/store/molecule-store';

import type { Atom, Bond, BondPolarity, Molecule } from '@/lib/chemistry';

const POLARITY_LABEL: Record<BondPolarity, string> = {
  'nonpolar-covalent': 'Nonpolar covalent',
  'polar-covalent': 'Polar covalent',
  ionic: 'Ionic',
};

const POLARITY_COLOR: Record<BondPolarity, string> = {
  'nonpolar-covalent': 'text-mist',
  'polar-covalent': 'text-amber',
  ionic: 'text-rose',
};

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-edge/50 py-1.5 last:border-0">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-mist">{label}</span>
      <span className={`text-right text-xs text-chalk ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-aqua">
      {icon}
      {title}
    </h2>
  );
}

/** Human-readable bond angles at this atom, e.g. "104.5° H–O–H". */
function angleReadouts(atom: Atom, atoms: Atom[], bonds: Bond[]): string[] {
  const neighbors = bonds
    .filter((b) => b.a === atom.id || b.b === atom.id)
    .map((b) => atoms.find((x) => x.id === (b.a === atom.id ? b.b : b.a)))
    .filter((x): x is Atom => x !== undefined);
  const out: string[] = [];
  for (let i = 0; i < neighbors.length; i++) {
    for (let j = i + 1; j < neighbors.length; j++) {
      const deg = bondAngle(neighbors[i].position, atom.position, neighbors[j].position);
      out.push(`${deg.toFixed(1)}° ${neighbors[i].element}–${atom.element}–${neighbors[j].element}`);
    }
  }
  return out;
}

function AtomDetails({ atom, atoms, bonds }: { atom: Atom; atoms: Atom[]; bonds: Bond[] }) {
  const el = elementOf(atom.element);
  const angles = angleReadouts(atom, atoms, bonds);
  const neighborGroups = new Map<string, { count: number; total: number }>();
  for (const bond of bonds) {
    if (bond.a !== atom.id && bond.b !== atom.id) continue;
    const other = atoms.find((x) => x.id === (bond.a === atom.id ? bond.b : bond.a));
    if (!other) continue;
    const entry = neighborGroups.get(other.element) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += distance(atom.position, other.position);
    neighborGroups.set(other.element, entry);
  }
  const bonded =
    neighborGroups.size > 0
      ? [...neighborGroups.entries()]
          .map(([sym, g]) => `${g.count} × ${sym} @ ${(g.total / g.count).toFixed(2)} Å`)
          .join(' · ')
      : null;
  return (
    <>
      <SectionTitle icon={<AtomIcon size={13} />} title={`Atom · ${el.name}`} />
      <div className="mb-3 flex items-center gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-edge font-display text-lg font-bold text-void"
          style={{ backgroundColor: el.color }}
        >
          {el.symbol}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-chalk">{el.name}</p>
          <p className="font-mono text-[10px] text-mist">
            Z {el.atomicNumber} · {el.category}
          </p>
        </div>
      </div>
      <Row label="Atomic mass" value={`${el.mass.toFixed(3)} u`} />
      <Row label="Electronegativity" value={el.electronegativity.toFixed(2)} />
      <Row label="Covalent radius" value={`${el.covalentRadius.toFixed(2)} Å`} />
      <Row label="vdW radius" value={`${el.vdwRadius.toFixed(2)} Å`} />
      <Row label="Phase (STP)" value={el.phase} />
      {bonded ? <Row label="Bonded" value={bonded} /> : null}
      <Row label="Electron config" value={el.electronConfig} mono={false} />
      <Row label="Position" value={`(${atom.position.map((n) => n.toFixed(2)).join(', ')})`} />
      {angles.length > 0 ? (
        <Row
          label={angles.length > 1 ? `Bond angles (${angles.length})` : 'Bond angle'}
          value={angles.slice(0, 2).join(' · ') + (angles.length > 2 ? ` +${angles.length - 2}` : '')}
        />
      ) : null}
    </>
  );
}

function BondDetails({ bond, atoms }: { bond: Bond; atoms: Atom[] }) {
  const cycleBondOrder = useMoleculeStore((s) => s.cycleBondOrder);
  const a = atoms.find((x) => x.id === bond.a);
  const b = atoms.find((x) => x.id === bond.b);
  if (!a || !b) return null;
  const analysis = analyzeBond(a, b);

  return (
    <>
      <SectionTitle icon={<Link2 size={13} />} title={`Bond · ${a.element}–${b.element}`} />
      <div className="mb-3 flex items-center gap-2">
        {[1, 2, 3].map((order) => (
          <button
            key={order}
            type="button"
            onClick={() => cycleBondOrder(bond.id)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-all duration-150 active:scale-95 ${
              bond.order === order
                ? 'border-aqua bg-aqua/15 text-aqua'
                : 'border-edge bg-panel/50 text-mist hover:border-aqua/40 hover:text-chalk'
            }`}
            title="Click to cycle bond order"
          >
            {order === 1 ? 'Single' : order === 2 ? 'Double' : 'Triple'}
          </button>
        ))}
      </div>
      <Row label="Length" value={`${analysis.length.toFixed(3)} Å`} />
      <Row label="Δ Electronegativity" value={analysis.deltaEn.toFixed(2)} />
      <div className="flex items-baseline justify-between gap-3 border-b border-edge/50 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-mist">Character</span>
        <span className={`font-mono text-xs font-semibold ${POLARITY_COLOR[analysis.polarity]}`}>
          {POLARITY_LABEL[analysis.polarity]}
        </span>
      </div>
    </>
  );
}

function CompositionBars({ atoms }: { atoms: Atom[] }) {
  if (atoms.length === 0) return null;
  const counts = new Map<string, number>();
  for (const atom of atoms) counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  const entries = [...counts.entries()].sort((x, y) => y[1] - x[1]);
  return (
    <div className="mt-2 space-y-1.5 border-b border-edge/50 pb-2.5">
      {entries.map(([symbol, count]) => {
        const el = elementOf(symbol);
        const pct = Math.max(4, (count / atoms.length) * 100);
        return (
          <div key={symbol} className="flex items-center gap-2">
            <span className="w-6 shrink-0 font-mono text-[10px] text-mist">{symbol}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-edge/60">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: el.color }} />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-[10px] text-chalk">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function MoleculeSummary({ atoms, bonds }: { atoms: Atom[]; bonds: Bond[] }) {
  const molecule: Molecule = { atoms, bonds };
  const formula = molecularFormula(molecule);
  const mass = molarMass(molecule);
  const rg = radiusOfGyration(molecule);
  const dipole = netDipole(molecule);
  const counts = { single: 0, double: 0, triple: 0 };
  for (const bond of bonds) {
    if (bond.order === 1) counts.single += 1;
    else if (bond.order === 2) counts.double += 1;
    else counts.triple += 1;
  }

  return (
    <>
      <SectionTitle icon={<Sigma size={13} />} title="Molecule" />
      <Row label="Formula" value={formula === '' ? '—' : formula} />
      <CompositionBars atoms={atoms} />
      <Row label="Molar mass" value={atoms.length ? `${mass.toFixed(3)} g/mol` : '—'} />
      <Row label="Atoms" value={String(atoms.length)} />
      <Row
        label="Bonds"
        value={`${bonds.length} (${counts.single} single, ${counts.double} double, ${counts.triple} triple)`}
      />
      <div className="flex items-baseline justify-between gap-3 border-b border-edge/50 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-mist">Polarity</span>
        <span className={`font-mono text-xs font-semibold ${dipole.isPolar ? 'text-amber' : 'text-mist'}`}>
          {atoms.length === 0 ? '—' : dipole.isPolar ? `Polar (μ ${dipole.magnitude.toFixed(2)})` : 'Nonpolar'}
        </span>
      </div>
      <Row label="Radius of gyration" value={atoms.length ? `${rg.toFixed(2)} Å` : '—'} />
    </>
  );
}

export function InfoPanel() {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const selection = useMoleculeStore((s) => s.selection);

  const selectedAtom = selection?.kind === 'atom' ? atoms.find((a) => a.id === selection.id) : undefined;
  const selectedBond = selection?.kind === 'bond' ? bonds.find((b) => b.id === selection.id) : undefined;

  return (
    <aside className="glass pointer-events-auto absolute right-3 top-16 z-20 hidden max-h-[calc(100vh-8rem)] w-72 overflow-y-auto rounded-2xl p-4 scroll-thin md:block">
      {selectedAtom ? (
        <AtomDetails atom={selectedAtom} atoms={atoms} bonds={bonds} />
      ) : selectedBond ? (
        <BondDetails bond={selectedBond} atoms={atoms} />
      ) : (
        <>
          <SectionTitle icon={<Info size={13} />} title="Inspector" />
          <p className="mb-3 text-[11px] leading-relaxed text-mist">
            Select an atom or bond in the 3D view to inspect its chemical properties.
          </p>
          <MoleculeSummary atoms={atoms} bonds={bonds} />
        </>
      )}
      {(selectedAtom || selectedBond) && (
        <div className="mt-4 border-t border-edge/60 pt-3">
          <MoleculeSummary atoms={atoms} bonds={bonds} />
        </div>
      )}
    </aside>
  );
}
