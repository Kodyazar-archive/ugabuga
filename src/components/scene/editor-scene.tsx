import { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { AtomMesh } from './atom-mesh';
import { atomRadius } from './atom-appearance';
import { BondMesh } from './bond-mesh';
import { DipoleArrow } from './dipole-arrow';

import { bondLengthFor, centroid } from '@/lib/chemistry';
import { useMoleculeStore } from '@/store/molecule-store';

import type { ThreeEvent } from '@react-three/fiber';
import type { Atom } from '@/lib/chemistry';

const DRAG_EPSILON = 4; // px moved before a press counts as a drag
const CLICK_DELTA = 4; // ignore click events that follow an orbit/drag gesture

interface PendingDrag {
  atomId: string;
  plane: THREE.Plane;
  grabbedOffset: THREE.Vector3;
  moved: boolean;
  pointerDown: { x: number; y: number };
}

/** Projects a ray onto a camera-facing plane and returns the hit point. */
function projectOntoPlane(ray: THREE.Ray, plane: THREE.Plane): THREE.Vector3 | null {
  const target = new THREE.Vector3();
  return ray.intersectPlane(plane, target) ? target : null;
}

/** Molecule center as a THREE vector — single source for outward placement. */
function centerOf(atoms: Atom[]): THREE.Vector3 {
  const [x, y, z] = centroid({ atoms, bonds: [] });
  return new THREE.Vector3(x, y, z);
}

export function EditorScene() {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const tool = useMoleculeStore((s) => s.tool);
  const displayMode = useMoleculeStore((s) => s.displayMode);
  const atomScale = useMoleculeStore((s) => s.atomScale);
  const bondScale = useMoleculeStore((s) => s.bondScale);
  const selection = useMoleculeStore((s) => s.selection);
  const showLabels = useMoleculeStore((s) => s.showLabels);
  const bondPendingId = useMoleculeStore((s) => s.bondPendingId);
  const addAtom = useMoleculeStore((s) => s.addAtom);
  const moveAtom = useMoleculeStore((s) => s.moveAtom);
  const deleteAtom = useMoleculeStore((s) => s.deleteAtom);
  const deleteBond = useMoleculeStore((s) => s.deleteBond);
  const requestBond = useMoleculeStore((s) => s.requestBond);
  const cancelBondRequest = useMoleculeStore((s) => s.cancelBondRequest);
  const select = useMoleculeStore((s) => s.select);
  const setDragging = useMoleculeStore((s) => s.setDragging);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragRef = useRef<PendingDrag | null>(null);
  const planeRef = useRef<THREE.Plane>(new THREE.Plane());

  const atomById = useMemo(() => new Map(atoms.map((a) => [a.id, a])), [atoms]);

  const handleAtomPointerDown = useCallback(
    (atom: Atom, e: ThreeEvent<PointerEvent>) => {
      if (tool !== 'select') return;
      e.stopPropagation();
      const cameraDir = new THREE.Vector3();
      e.camera.getWorldDirection(cameraDir);
      const plane = planeRef.current;
      plane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...atom.position));
      const hit = projectOntoPlane(e.ray, plane);
      if (!hit) return;
      dragRef.current = {
        atomId: atom.id,
        plane,
        grabbedOffset: new THREE.Vector3(...atom.position).sub(hit),
        moved: false,
        pointerDown: { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY },
      };
      setDragging(true);
      (e.nativeEvent.target as Element | null)?.setPointerCapture?.(e.pointerId);
    },
    [setDragging, tool],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.nativeEvent.clientX - drag.pointerDown.x;
      const dy = e.nativeEvent.clientY - drag.pointerDown.y;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_EPSILON) return;
      drag.moved = true;
      e.stopPropagation();
      const hit = projectOntoPlane(e.ray, drag.plane);
      if (!hit) return;
      const next = hit.add(drag.grabbedOffset);
      moveAtom(drag.atomId, [next.x, next.y, next.z], false);
    },
    [moveAtom],
  );

  const endDrag = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      setDragging(false);
      (e.nativeEvent.target as Element | null)?.releasePointerCapture?.(e.pointerId);
      if (!drag.moved) return;
      const atom = atomById.get(drag.atomId);
      if (atom) moveAtom(drag.atomId, atom.position, true);
    },
    [atomById, moveAtom, setDragging],
  );

  const handleAtomClick = useCallback(
    (atom: Atom, e: ThreeEvent<MouseEvent>) => {
      if (e.delta > CLICK_DELTA) return;
      e.stopPropagation();
      switch (tool) {
        case 'select':
          select({ kind: 'atom', id: atom.id });
          return;
        case 'add': {
          // Grow outward from the molecule's centroid for predictable placement.
          const center = centerOf(atoms);
          const away = new THREE.Vector3(...atom.position).sub(center);
          if (away.lengthSq() < 1e-4) {
            const camDir = new THREE.Vector3();
            e.camera.getWorldDirection(camDir);
            away.copy(camDir).negate();
          }
          const pos = new THREE.Vector3(...atom.position).add(
            away.normalize().multiplyScalar(bondLengthFor(atom.element, 'C')),
          );
          addAtom([pos.x, pos.y, pos.z]);
          return;
        }
        case 'bond':
          requestBond(atom.id);
          return;
        case 'delete':
          deleteAtom(atom.id);
          return;
      }
    },
    [addAtom, atoms, deleteAtom, requestBond, select, tool],
  );

  const handleBondClick = useCallback(
    (bondId: string, e: ThreeEvent<MouseEvent>) => {
      if (e.delta > CLICK_DELTA) return;
      e.stopPropagation();
      if (tool === 'delete') deleteBond(bondId);
      else select({ kind: 'bond', id: bondId });
    },
    [deleteBond, select, tool],
  );

  const handleBackgroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > CLICK_DELTA) return;
      if (tool === 'add') {
        const center = centerOf(atoms);
        const cameraDir = new THREE.Vector3();
        e.camera.getWorldDirection(cameraDir);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, center);
        const hit = projectOntoPlane(e.ray, plane);
        if (hit) addAtom([hit.x, hit.y, hit.z]);
        return;
      }
      if (tool === 'bond' && bondPendingId) cancelBondRequest();
      select(null);
    },
    [addAtom, atoms, bondPendingId, cancelBondRequest, select, tool],
  );

  return (
    <group onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {/* Backdrop plane catches clicks and pointer moves on empty space. */}
      <mesh
        position={[0, 0, -18]}
        onClick={handleBackgroundClick}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        visible={false}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial />
      </mesh>
      {bonds.map((bond) => {
        const a = atomById.get(bond.a);
        const b = atomById.get(bond.b);
        if (!a || !b) return null;
        const selected = selection?.kind === 'bond' && selection.id === bond.id;
        return (
          <BondMesh
            key={bond.id}
            bond={bond}
            atomA={a}
            atomB={b}
            mode={displayMode}
            tubeScale={bondScale}
            selected={selected}
            onClick={(e) => handleBondClick(bond.id, e)}
          />
        );
      })}
      {atoms.map((atom) => {
        const radius = atomRadius(atom.element, displayMode, atomScale);
        return (
          <AtomMesh
            key={atom.id}
            atom={atom}
            radius={radius}
            hovered={hoveredId === atom.id}
            selected={selection?.kind === 'atom' && selection.id === atom.id}
            pending={bondPendingId === atom.id}
            showLabel={showLabels && displayMode !== 'space-filling'}
            onPointerDown={(e) => handleAtomPointerDown(atom, e)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(atom.id);
            }}
            onPointerOut={() => setHoveredId(null)}
            onClick={(e) => handleAtomClick(atom, e)}
          />
        );
      })}
      <DipoleArrow />
    </group>
  );
}
