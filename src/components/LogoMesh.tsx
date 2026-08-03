import type { ThreeEvent } from '@react-three/fiber'
import type { Object3D } from 'three'
import { LOGO_GLB_ROTATION, LOGO_GLB_SCALE } from './logoAsset'
import {
  LOGO_HITBOX_DEPTH,
  type LogoLayout,
} from './logoGeometry'

type LogoMeshProps = {
  glbScene: Object3D
}

type LogoHitboxProps = {
  logoLayout: LogoLayout
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
}

export function LogoHitbox({
  logoLayout,
  onPointerDown,
}: LogoHitboxProps) {
  return (
    <mesh name="logo-hitbox" onPointerDown={onPointerDown}>
      <boxGeometry args={[logoLayout.width, logoLayout.height, LOGO_HITBOX_DEPTH]} />
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  )
}

export function LogoMesh({ glbScene }: LogoMeshProps) {
  return (
    <primitive
      name="logo-glb-model"
      object={glbScene}
      rotation={LOGO_GLB_ROTATION}
      scale={LOGO_GLB_SCALE}
    />
  )
}
