import type { ThreeEvent } from '@react-three/fiber'
import type { Object3D } from 'three'
import { LOGO_GLB_ROTATION, LOGO_GLB_SCALE } from './logoAsset'
import {
  LOGO_HITBOX_DEPTH,
  type LogoLayout,
} from './logoGeometry'

type LogoMeshProps = {
  glbScene: Object3D
  highlightScene: Object3D
  logoLayout: LogoLayout
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
}

export function LogoMesh({
  glbScene,
  highlightScene,
  logoLayout,
  onPointerDown,
}: LogoMeshProps) {
  return (
    <group onPointerDown={onPointerDown}>
      <mesh name="logo-hitbox">
        <boxGeometry args={[logoLayout.width, logoLayout.height, LOGO_HITBOX_DEPTH]} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>
      <primitive
        object={glbScene}
        rotation={LOGO_GLB_ROTATION}
        scale={LOGO_GLB_SCALE}
      />
      <primitive
        object={highlightScene}
        renderOrder={10}
        rotation={LOGO_GLB_ROTATION}
        scale={LOGO_GLB_SCALE}
      />
    </group>
  )
}
