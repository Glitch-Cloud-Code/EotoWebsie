import { useEffect, useMemo } from 'react'
import { BufferGeometry, PlaneGeometry } from 'three'
import {
  createLogoHaloMaterial,
  LOGO_HALO_RENDER_ORDER,
  LOGO_HALO_SCALE,
  LOGO_HALO_Z,
} from './logoHaloMaterial'

type LogoHaloProps = {
  height: number
  width: number
}

export function LogoHalo({ height, width }: LogoHaloProps) {
  const geometry = useMemo<BufferGeometry>(() => new PlaneGeometry(2, 2), [])
  const material = useMemo(() => createLogoHaloMaterial(), [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <mesh
      geometry={geometry}
      material={material}
      name="logo-halo"
      position={[0, 0, LOGO_HALO_Z]}
      renderOrder={LOGO_HALO_RENDER_ORDER}
      scale={[
        width * LOGO_HALO_SCALE * 0.68,
        height * LOGO_HALO_SCALE * 0.68,
        1,
      ]}
    />
  )
}
