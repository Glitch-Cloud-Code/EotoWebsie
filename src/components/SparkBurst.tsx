import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from 'three'
import { createSeededRandom } from '../utils/random'
import {
  createSparkAttributes,
  LOGO_SPARK_LIFETIME_SECONDS,
  type Point3D,
} from './logoSparks'

type SparkBurstProps = {
  id: number
  onComplete: (id: number) => void
  origin: Point3D
}

export function SparkBurst({ id, onComplete, origin }: SparkBurstProps) {
  const pointsRef = useRef<Points>(null)
  const completed = useRef(false)
  const elapsed = useRef(0)

  const geometry = useMemo(() => {
    const { positions, scales, seeds, velocities } = createSparkAttributes(createSeededRandom(4109 + id))
    const nextGeometry = new BufferGeometry()

    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aScale', new Float32BufferAttribute(scales, 1))
    nextGeometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    nextGeometry.setAttribute('aVelocity', new Float32BufferAttribute(velocities, 3))
    return nextGeometry
  }, [id])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        uniforms: {
          uLifetime: { value: LOGO_SPARK_LIFETIME_SECONDS },
          uTime: { value: 0 },
        },
        vertexShader: `
          uniform float uLifetime;
          uniform float uTime;
          attribute float aScale;
          attribute float aSeed;
          attribute vec3 aVelocity;
          varying float vLife;
          varying float vSeed;

          void main() {
            float life = clamp(uTime / uLifetime, 0.0, 1.0);
            vec3 transformed = position + aVelocity * life;
            transformed.z -= 80.0 * life * life;

            vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = aScale * (1.0 - life) / max(0.28, -mvPosition.z * 0.045);

            vLife = life;
            vSeed = aSeed;
          }
        `,
        fragmentShader: `
          varying float vLife;
          varying float vSeed;

          void main() {
            vec2 centered = gl_PointCoord - vec2(0.5);
            float distanceToCenter = length(centered);
            if (distanceToCenter > 0.5) {
              discard;
            }

            float core = smoothstep(0.5, 0.0, distanceToCenter);
            vec3 amber = vec3(1.0, 0.38, 0.05);
            vec3 white = vec3(1.0, 0.96, 0.74);
            vec3 color = mix(amber, white, 0.45 + 0.25 * sin(vSeed * 31.0));
            float alpha = core * (1.0 - smoothstep(0.2, 1.0, vLife));

            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    elapsed.current += delta
    const currentMaterial = pointsRef.current?.material as ShaderMaterial | undefined

    if (currentMaterial) {
      currentMaterial.uniforms.uTime.value = elapsed.current
    }

    if (!completed.current && elapsed.current > LOGO_SPARK_LIFETIME_SECONDS) {
      completed.current = true
      onComplete(id)
    }
  })

  return (
    <points
      frustumCulled={false}
      geometry={geometry}
      material={material}
      position={[origin.x, origin.y, origin.z]}
      ref={pointsRef}
      renderOrder={8}
    />
  )
}
