import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial } from 'three'
import { createGodRayMaterial } from './logoGodRayMaterial'
import {
  createGodRayGeometryData,
  getGodRayFieldTransform,
  LOGO_GOD_RAY_RENDER_ORDER,
} from './logoGodRays'
import type { LogoQuality } from './logoQuality'

type GodRaysProps = {
  height: number
  quality: LogoQuality
  width: number
}

export function GodRays({ height, quality, width }: GodRaysProps) {
  const meshRef = useRef<Mesh>(null)
  const hazeRef = useRef<Mesh>(null)

  const geometry = useMemo(() => {
    const {
      across,
      alongs,
      lifecycleSeeds,
      positions,
      seeds,
    } = createGodRayGeometryData(width, height, { quality })
    const nextGeometry = new BufferGeometry()

    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aAlong', new Float32BufferAttribute(alongs, 1))
    nextGeometry.setAttribute(
      'aLifecycleSeed',
      new Float32BufferAttribute(lifecycleSeeds, 1),
    )
    nextGeometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    nextGeometry.setAttribute(
      'aAcross',
      new Float32BufferAttribute(across, 1),
    )
    return nextGeometry
  }, [height, quality, width])

  const material = useMemo(() => createGodRayMaterial(), [])
  const hazeMaterial = useMemo(
    () => (quality === 'high' ? createGodRayMaterial({ haze: true }) : null),
    [quality],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      hazeMaterial?.dispose()
    }
  }, [geometry, hazeMaterial, material])

  useFrame((state) => {
    const currentMesh = meshRef.current
    const currentHaze = hazeRef.current
    const transform = getGodRayFieldTransform(state.clock.elapsedTime)

    for (const mesh of [currentMesh, currentHaze]) {
      const currentMaterial = mesh?.material as ShaderMaterial | undefined

      if (currentMaterial) {
        currentMaterial.uniforms.uTime.value = state.clock.elapsedTime
      }

      if (mesh) {
        mesh.position.x = transform.x
        mesh.position.y = transform.y
        mesh.rotation.z = transform.rotationZ
      }
    }
  })

  return (
    <>
      {hazeMaterial ? (
        <mesh
          frustumCulled={false}
          geometry={geometry}
          material={hazeMaterial}
          name="logo-god-ray-haze"
          ref={hazeRef}
          renderOrder={LOGO_GOD_RAY_RENDER_ORDER}
        />
      ) : null}
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        name="logo-god-rays"
        ref={meshRef}
        renderOrder={LOGO_GOD_RAY_RENDER_ORDER + 1}
      />
    </>
  )
}
