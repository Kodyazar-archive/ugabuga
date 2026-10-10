import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useMoleculeStore } from '@/store/molecule-store';

const FIT_PADDING = 1.45;
const ATOM_MARGIN = 0.6;
const MIN_FIT_DISTANCE = 3;
const EMPTY_SCENE_DISTANCE = 8;
/** Direction the camera looks from after a fit — slightly off-axis for depth cues. */
const VIEW_DIRECTION = new THREE.Vector3(0.32, 0.22, 1).normalize();

interface OrbitControlsLike {
  target: THREE.Vector3;
  update: () => void;
}

function frameMolecule(camera: THREE.Camera, controls: OrbitControlsLike | null) {
  const atoms = useMoleculeStore.getState().atoms;
  const center = new THREE.Vector3();
  for (const atom of atoms) center.add(new THREE.Vector3(...atom.position));
  if (atoms.length > 0) center.divideScalar(atoms.length);

  let radius = 0;
  for (const atom of atoms) {
    radius = Math.max(radius, center.distanceTo(new THREE.Vector3(...atom.position)));
  }
  radius = atoms.length > 0 ? Math.max(radius + ATOM_MARGIN, 1.2) : EMPTY_SCENE_DISTANCE / 2;

  const perspective = camera as THREE.PerspectiveCamera;
  const fov = THREE.MathUtils.degToRad(perspective.fov);
  const distance = Math.max((radius * FIT_PADDING) / Math.tan(fov / 2), MIN_FIT_DISTANCE);

  if (controls) controls.target.copy(center);
  camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance);
  camera.lookAt(center);
  controls?.update();
}

/**
 * Frames the whole molecule on first mount, on every preset load and when the
 * scene becomes empty. Deliberately ignores per-atom edits so manual zoom and
 * drag gestures stay under user control.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsLike | null;
  const activePresetId = useMoleculeStore((s) => s.activePresetId);
  const atomCount = useMoleculeStore((s) => s.atoms.length);

  useEffect(() => {
    frameMolecule(camera, controls);
  }, [activePresetId, camera, controls]);

  useEffect(() => {
    if (atomCount !== 0) return;
    frameMolecule(camera, controls);
  }, [atomCount, camera, controls]);

  return null;
}
