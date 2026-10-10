import { PRESETS, presetToMolecule } from '../src/lib/molecule-library';
import { canBond, distance } from '../src/lib/chemistry';

let fail = 0;
for (const spec of PRESETS) {
  const mol = presetToMolecule(spec);
  const n = mol.atoms.length;
  const b = mol.bonds.length;
  // every atom must be part of the structure and bonds must be reasonable
  let minPair = Infinity;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distance(mol.atoms[i].position, mol.atoms[j].position);
      if (d < minPair) minPair = d;
      const bonded = canBond(mol.atoms[i], mol.atoms[j]);
      const explicit = mol.bonds.some(
        (x) =>
          (x.a === mol.atoms[i].id && x.b === mol.atoms[j].id) || (x.a === mol.atoms[j].id && x.b === mol.atoms[i].id),
      );
      if (bonded && !explicit) {
        console.log(
          `UNEXPECTED ${spec.id}: ${mol.atoms[i].element}${i}-${mol.atoms[j].element}${j} d=${d.toFixed(2)} detected but not in bond list`,
        );
        fail++;
      }
      if (explicit && !bonded) {
        console.log(
          `MISSING-DIST ${spec.id}: ${mol.atoms[i].element}${i}-${mol.atoms[j].element}${j} d=${d.toFixed(2)} explicit but beyond threshold`,
        );
        fail++;
      }
    }
  }
  // connectivity check
  const adj = new Map<number, number[]>();
  for (const bond of mol.bonds) {
    const ia = mol.atoms.findIndex((a) => a.id === bond.a);
    const ib = mol.atoms.findIndex((a) => a.id === bond.b);
    adj.set(ia, [...(adj.get(ia) ?? []), ib]);
    adj.set(ib, [...(adj.get(ib) ?? []), ia]);
  }
  if (n > 0) {
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const nb of adj.get(cur) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
    if (seen.size !== n) {
      console.log(`DISCONNECTED ${spec.id}: ${seen.size}/${n} reachable`);
      fail++;
    }
  }
  console.log(`OK ${spec.id}: ${n} atoms, ${b} bonds, minPairDist=${minPair.toFixed(2)}`);
}
console.log(fail === 0 ? 'ALL PRESETS VALID' : `${fail} PROBLEMS`);
