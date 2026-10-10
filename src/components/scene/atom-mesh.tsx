import { useMemo, useRef } from 'react';
import { Billboard, Outlines, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useMoleculeStore } from '@/store/molecule-store';

import { atomColor } from './atom-appearance';

import type { ThreeEvent } from '@react-three/fiber';
import type { Atom } from '@/lib/chemistry';

interface AtomMeshProps {
  atom: Atom;
  radius: number;
  hovered: boolean;
  selected: boolean;
  pending: boolean;
  showLabel: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

const HOVER_SCALE = 1.16;
const PULSE_AMPLITUDE = 0.045;
const PULSE_SPEED = 5;
/** Thermal jiggle amplitude in Å — visible but keeps bonds readable. */
const VIBRATE_AMPLITUDE = 0.06;

/** Stable per-atom phase so neighbors move out of sync like real thermal motion. */
function phaseFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return (hash / 1000) * Math.PI * 2;
}

export function AtomMesh({
  atom,
  radius,
  hovered,
  selected,
  pending,
  showLabel,
  onPointerDown,
  onPointerOver,
  onPointerOut,
  onClick,
}: AtomMeshProps) {
  const scaleRef = useRef<THREE.Group>(null);
  const jiggleRef = useRef<THREE.Group>(null);
  const vibrating = useMoleculeStore((s) => s.vibrating);
  const phase = useMemo(() => phaseFor(atom.id), [atom.id]);

  useFrame((state) => {
    const scaleGroup = scaleRef.current;
    if (scaleGroup) {
      const target = hovered ? HOVER_SCALE : 1;
      const pulse = selected || pending ? 1 + Math.sin(state.clock.elapsedTime * PULSE_SPEED) * PULSE_AMPLITUDE : 1;
      const next = THREE.MathUtils.lerp(scaleGroup.scale.x, target * pulse, 0.25);
      scaleGroup.scale.setScalar(next);
    }
    const jiggle = jiggleRef.current;
    if (jiggle) {
      if (vibrating) {
        const t = state.clock.elapsedTime;
        jiggle.position.set(
          Math.sin(t * 6.1 + phase) * VIBRATE_AMPLITUDE,
          Math.sin(t * 7.3 + phase * 1.7) * VIBRATE_AMPLITUDE,
          Math.sin(t * 5.2 + phase * 2.3) * VIBRATE_AMPLITUDE,
        );
      } else {
        jiggle.position.lerp(new THREE.Vector3(0, 0, 0), 0.3);
      }
    }
  });

  const outlineColor = pending ? '#f5b85c' : '#45e0d0';
  const showOutline = selected || pending || hovered;

  return (
    <group position={atom.position}>
      <group ref={jiggleRef}>
        <group ref={scaleRef}>
          <mesh
            onPointerDown={onPointerDown}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onClick}
          >
            <sphereGeometry args={[radius, 32, 24]} />
            <meshStandardMaterial
              color={atomColor(atom.element)}
              roughness={0.32}
              metalness={0.18}
              emissive={showOutline ? outlineColor : '#000000'}
              emissiveIntensity={showOutline ? 0.22 : 0}
            />
            {showOutline ? <Outlines thickness={0.03} color={outlineColor} /> : null}
          </mesh>
        </group>
      </group>
      {showLabel ? (
        <Billboard position={[0, radius + 0.34, 0]}>
          <Text
            fontSize={0.26}
            color="#e6edf6"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#05070c"
          >
            {atom.element}
          </Text>
        </Billboard>
      ) : null}
    </group>
  );
}
