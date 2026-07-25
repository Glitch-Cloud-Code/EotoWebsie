import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
} from 'three'
import {
  createParticleAttributes,
  LOGO_RENDER_ORDER,
  PARTICLE_KIND_SETTINGS,
  type ParticleKind,
  type Point2D,
} from './logoParticles'
import { createParticleMaterial } from './logoParticleMaterial'
import { getParticleCount, type LogoQuality } from './logoQuality'

type ParticleFieldProps = {
  emitters: Point2D[]
  kind: ParticleKind
  quality: LogoQuality
}

export function ParticleField({ emitters, kind, quality }: ParticleFieldProps) {
  const pointsRef = useRef<Points>(null)
  const renderer = useThree((state) => state.gl)

  const geometry = useMemo(() => {
    const { drifts, positions, scales, seeds } = createParticleAttributes(
      emitters,
      kind,
      undefined,
      getParticleCount(kind, PARTICLE_KIND_SETTINGS[kind].count, quality),
    )

    const nextGeometry = new BufferGeometry()
    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aScale', new Float32BufferAttribute(scales, 1))
    nextGeometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    nextGeometry.setAttribute('aDrift', new Float32BufferAttribute(drifts, 3))
    return nextGeometry
  }, [emitters, kind, quality])

  const material = useMemo(
    () => createParticleMaterial(kind, renderer.getPixelRatio()),
    [kind, renderer],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    if (!pointsRef.current) {
      return
    }

    const currentMaterial = pointsRef.current.material as ShaderMaterial
    currentMaterial.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
    currentMaterial.uniforms.uTime.value = state.clock.elapsedTime
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35) * (kind === 'smoke' ? 0.04 : 0.02)
  })

  return (
    <points
      frustumCulled={false}
      geometry={geometry}
      material={material}
      name={`logo-${kind}-particles`}
      ref={pointsRef}
      renderOrder={LOGO_RENDER_ORDER.particles}
    />
  )
}
