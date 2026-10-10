import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, Stars } from '@react-three/drei';

import { CameraRig } from './camera-rig';
import { EditorScene } from './editor-scene';

import { useMoleculeStore } from '@/store/molecule-store';

const AUTO_ROTATE_SPEED = 0.6;

export function MoleculeCanvas() {
  const autoRotate = useMoleculeStore((s) => s.autoRotate);
  const dragging = useMoleculeStore((s) => s.dragging);

  return (
    <Canvas
      camera={{ position: [0, 1.5, 9], fov: 45, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#05070c', 14, 40]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.4} />
      <directionalLight position={[-5, -3, -6]} intensity={0.35} color="#45e0d0" />
      <Stars radius={60} depth={30} count={2200} factor={3} saturation={0} fade speed={0.6} />
      <CameraRig />
      <EditorScene />
      <ContactShadows position={[0, -4.2, 0]} opacity={0.4} scale={18} blur={2.4} far={5} color="#45e0d0" />
      {/* Locally rendered studio lighting — no external HDR download. */}
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 4, 6]} scale={[8, 3, 1]} color="#e6edf6" />
        <Lightformer intensity={1.1} position={[-6, -1, -4]} scale={[4, 6, 1]} color="#45e0d0" />
        <Lightformer intensity={0.7} position={[6, -2, -2]} scale={[4, 4, 1]} color="#f5b85c" />
      </Environment>
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={AUTO_ROTATE_SPEED}
        enableDamping
        enabled={!dragging}
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={30}
        makeDefault
      />
    </Canvas>
  );
}

export default MoleculeCanvas;
