import { useMemo } from 'react';
import * as THREE from 'three';

import { atomColor, bondTubeRadius, perpendiculars } from './atom-appearance';

import type { ThreeEvent } from '@react-three/fiber';
import type { Atom, Bond } from '@/lib/chemistry';
import type { DisplayMode } from '@/store/molecule-store';

interface BondMeshProps {
  bond: Bond;
  atomA: Atom;
  atomB: Atom;
  mode: DisplayMode;
  tubeScale: number;
  selected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

interface Tube {
  key: string;
  position: [number, number, number];
  quaternion: THREE.Quaternion;
  length: number;
  radius: number;
  color: string;
}

const STRAND_OFFSET = 0.21;
const UP = new THREE.Vector3(0, 1, 0);

function strandOffsets(order: 1 | 2 | 3, u: [number, number, number]): Array<[number, number, number]> {
  const scale = (n: number): [number, number, number] => [u[0] * n, u[1] * n, u[2] * n];
  if (order === 1) return [scale(0)];
  if (order === 2) return [scale(-STRAND_OFFSET / 2), scale(STRAND_OFFSET / 2)];
  return [scale(-STRAND_OFFSET), scale(0), scale(STRAND_OFFSET)];
}

export function BondMesh({ bond, atomA, atomB, mode, tubeScale, selected, onClick }: BondMeshProps) {
  const tubes = useMemo<Tube[]>(() => {
    const a = new THREE.Vector3(...atomA.position);
    const b = new THREE.Vector3(...atomB.position);
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    if (length < 1e-4) return [];
    const unit = dir.clone().divideScalar(length);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, unit);
    const { u } = perpendiculars([unit.x, unit.y, unit.z]);
    const radius = bondTubeRadius(mode, tubeScale) * (bond.order === 1 ? 1 : 0.72);
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

    const result: Tube[] = [];
    for (const [index, offset] of strandOffsets(bond.order, u).entries()) {
      const off = new THREE.Vector3(...offset);
      // Two halves per strand, each colored by its owning atom (CPK convention).
      const halfA = a.clone().add(mid).multiplyScalar(0.5).add(off);
      const halfB = b.clone().add(mid).multiplyScalar(0.5).add(off);
      result.push({
        key: `${bond.id}-${index}-a`,
        position: halfA.toArray(),
        quaternion,
        length: length / 2,
        radius,
        color: atomColor(atomA.element),
      });
      result.push({
        key: `${bond.id}-${index}-b`,
        position: halfB.toArray(),
        quaternion,
        length: length / 2,
        radius,
        color: atomColor(atomB.element),
      });
    }
    return result;
  }, [atomA, atomB, bond.id, bond.order, mode, tubeScale]);

  // Invisible fat cylinder so thin bonds are easy to click.
  const hit = useMemo(() => {
    const a = new THREE.Vector3(...atomA.position);
    const b = new THREE.Vector3(...atomB.position);
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    if (length < 1e-4) return null;
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    const position = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    return { position: position.toArray() as [number, number, number], quaternion, length };
  }, [atomA, atomB]);

  const emissive = selected ? '#45e0d0' : '#000000';

  return (
    <group>
      {tubes.map((tube) => (
        <mesh key={tube.key} position={tube.position} quaternion={tube.quaternion}>
          <cylinderGeometry args={[tube.radius, tube.radius, tube.length, 14]} />
          <meshStandardMaterial
            color={tube.color}
            roughness={0.4}
            metalness={0.1}
            emissive={emissive}
            emissiveIntensity={selected ? 0.35 : 0}
          />
        </mesh>
      ))}
      {hit ? (
        <mesh position={hit.position} quaternion={hit.quaternion} onClick={onClick} visible={false}>
          <cylinderGeometry args={[0.24, 0.24, hit.length, 8]} />
          <meshBasicMaterial />
        </mesh>
      ) : null}
    </group>
  );
}
