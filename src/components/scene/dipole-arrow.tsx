import { useMemo } from 'react';
import * as THREE from 'three';

import { centroid, netDipole } from '@/lib/chemistry';
import { useMoleculeStore } from '@/store/molecule-store';

/** Length of the dipole arrow in Å — fixed so it reads at any molecule size. */
const ARROW_LENGTH = 1.6;

/**
 * Amber arrow through the centroid along the net dipole, shown only for
 * polar molecules while the dipole layer is enabled.
 */
export function DipoleArrow() {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const showDipole = useMoleculeStore((s) => s.showDipole);

  const arrow = useMemo(() => {
    if (!showDipole || atoms.length === 0) return null;
    const result = netDipole({ atoms, bonds });
    if (!result.isPolar) return null;
    const dir = new THREE.Vector3(...result.vector);
    if (dir.lengthSq() < 1e-8) return null;
    dir.normalize();
    const start = new THREE.Vector3(...centroid({ atoms, bonds })).addScaledVector(dir, -ARROW_LENGTH / 2);
    return { dir, start };
  }, [atoms, bonds, showDipole]);

  if (!arrow) return null;
  return <arrowHelper args={[arrow.dir, arrow.start, ARROW_LENGTH, '#f5b85c', 0.34, 0.2]} />;
}
