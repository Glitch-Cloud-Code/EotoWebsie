import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial } from 'three'
import { createGodRayMaterial } from './logoGodRayMaterial'
import {
  createGodRayGeometryData,
  LOGO_GOD_RAY_RENDER_ORDER,
} from './logoGodRays'

type GodRaysProps = {
  height: number
  width: number
}

export function GodRays({ height, width }: GodRaysProps) {
  const meshRef = useRef<Mesh>(null)

  const geometry = useMemo(() => {
    const { fades, positions, seeds } = createGodRayGeometryData(width, height)
    const nextGeometry = new BufferGeometry()

    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aFade', new Float32BufferAttribute(fades, 1))
    nextGeometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    return nextGeometry
  }, [height, width])

  const material = useMemo(createGodRayMaterial, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const currentMaterial = meshRef.current?.material as ShaderMaterial | undefined

    if (currentMaterial) {
      currentMaterial.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={material}
      ref={meshRef}
      renderOrder={LOGO_GOD_RAY_RENDER_ORDER}
    />
  )
}
