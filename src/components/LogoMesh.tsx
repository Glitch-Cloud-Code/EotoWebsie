import type { ThreeEvent } from '@react-three/fiber'
import type { Material } from 'three'
import {
  LOGO_HITBOX_DEPTH,
  type LogoGeometryEntry,
  type LogoLayout,
} from './logoGeometry'
import { LOGO_RENDER_ORDER } from './logoParticles'

type LogoMeshProps = {
  geometries: LogoGeometryEntry[]
  logoLayout: LogoLayout
  material: Material
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  textOverlayMaterial: Material
}

export function LogoMesh({
  geometries,
  logoLayout,
  material,
  onPointerDown,
  textOverlayMaterial,
}: LogoMeshProps) {
  return (
    <group onPointerDown={onPointerDown}>
      <mesh>
        <boxGeometry args={[logoLayout.width, logoLayout.height, LOGO_HITBOX_DEPTH]} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>
      {geometries.map(({ geometry }, index) => (
        <mesh
          castShadow
          geometry={geometry}
          key={index}
          material={material}
          receiveShadow
        />
      ))}
      {geometries
        .filter(({ isWordmark }) => isWordmark)
        .map(({ geometry }, index) => (
          <mesh
            geometry={geometry}
            key={`wordmark-overlay-${index}`}
            material={textOverlayMaterial}
            renderOrder={LOGO_RENDER_ORDER.textOverlay}
          />
        ))}
    </group>
  )
}
