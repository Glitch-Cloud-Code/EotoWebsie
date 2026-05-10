import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  NormalBlending,
  Points,
  ShaderMaterial,
} from 'three'
import {
  createParticleAttributes,
  LOGO_RENDER_ORDER,
  PARTICLE_DEPTH_CLAMP_Z,
  PARTICLE_KIND_SETTINGS,
  type ParticleKind,
  type Point2D,
} from './logoParticles'

type ParticleFieldProps = {
  emitters: Point2D[]
  kind: ParticleKind
}

export function ParticleField({ emitters, kind }: ParticleFieldProps) {
  const pointsRef = useRef<Points>(null)

  const geometry = useMemo(() => {
    const { drifts, positions, scales, seeds } = createParticleAttributes(emitters, kind)

    const nextGeometry = new BufferGeometry()
    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    nextGeometry.setAttribute('aScale', new Float32BufferAttribute(scales, 1))
    nextGeometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    nextGeometry.setAttribute('aDrift', new Float32BufferAttribute(drifts, 3))
    return nextGeometry
  }, [emitters, kind])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: PARTICLE_KIND_SETTINGS[kind].depthTest,
        blending: kind === 'flame' ? AdditiveBlending : NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window === 'undefined' ? 1 : window.devicePixelRatio },
          uAlphaMultiplier: { value: PARTICLE_KIND_SETTINGS[kind].alphaMultiplier },
          uKind: { value: kind === 'flame' ? 0 : 1 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
          uniform float uAlphaMultiplier;
          uniform float uKind;
          attribute float aScale;
          attribute float aSeed;
          attribute vec3 aDrift;
          varying float vLife;
          varying float vKind;
          varying float vSeed;

          void main() {
            float speed = mix(0.16, 0.55, 1.0 - uKind);
            speed *= mix(0.76, 0.54, 1.0 - uKind);
            float life = fract(uTime * speed + aSeed);
            float inverseLife = 1.0 - life;
            float fadeIn = smoothstep(0.0, 0.12, life);
            float fadeOut = 1.0 - smoothstep(${PARTICLE_KIND_SETTINGS.flame.fadeOutStart.toFixed(2)}, 1.0, life);
            float visibility = fadeIn * fadeOut;

            vec3 transformed = position;
            transformed.x += aDrift.x * life * mix(0.42, 0.94, uKind);
            transformed.y -= aDrift.y * pow(life, mix(1.58, 1.03, uKind));
            transformed.z += aDrift.z * life;

            transformed.x += sin((uTime * mix(1.6, 4.2, 1.0 - uKind)) + aSeed * 18.0) * mix(7.0, 2.7, uKind) * inverseLife;
            transformed.z += cos((uTime * mix(1.2, 3.3, 1.0 - uKind)) + aSeed * 15.0) * mix(5.0, 1.9, uKind) * inverseLife;
            transformed.y -= sin((uTime * mix(0.8, 2.0, 1.0 - uKind)) + aSeed * 13.0) * mix(8.5, 2.8, uKind) * inverseLife;
            transformed.z = min(transformed.z, ${PARTICLE_DEPTH_CLAMP_Z.toFixed(1)});

            vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = aScale * uPixelRatio * mix(1.95, 2.65, uKind) * (visibility + 0.24) / max(0.3, -mvPosition.z * 0.05);

            vLife = life;
            vKind = uKind;
            vSeed = aSeed;
          }
        `,
        fragmentShader: `
          uniform float uAlphaMultiplier;
          varying float vLife;
          varying float vKind;
          varying float vSeed;

          void main() {
            vec2 centered = gl_PointCoord - vec2(0.5);
            float distanceToCenter = length(centered);
            if (distanceToCenter > 0.5) {
              discard;
            }

            float softEdge = smoothstep(0.5, 0.0, distanceToCenter);
            float inverseLife = 1.0 - vLife;
            float fadeIn = smoothstep(0.0, 0.12, vLife);
            float fadeOut = 1.0 - smoothstep(${PARTICLE_KIND_SETTINGS.flame.fadeOutStart.toFixed(2)}, 1.0, vLife);
            float visibility = fadeIn * fadeOut;
            vec3 color;
            float alpha;

            if (vKind < 0.5) {
              vec3 ember = vec3(1.0, 0.24, 0.05);
              vec3 flame = vec3(1.0, 0.62, 0.12);
              vec3 core = vec3(1.0, 0.94, 0.74);
              color = mix(ember, flame, smoothstep(0.0, 0.45, inverseLife));
              color = mix(color, core, pow(inverseLife, 2.2));
              alpha = softEdge * visibility * (0.32 + pow(inverseLife, 0.7)) * uAlphaMultiplier;
            } else {
              vec3 denseSmoke = vec3(0.1, 0.08, 0.08);
              vec3 lightSmoke = vec3(0.58, 0.5, 0.49);
              color = mix(denseSmoke, lightSmoke, smoothstep(0.0, 1.0, vLife));
              alpha = softEdge * visibility * pow(inverseLife, 1.05) * uAlphaMultiplier;
            }

            alpha *= 0.8 + sin(vSeed * 41.0 + vLife * 12.0) * 0.08;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [kind],
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
    currentMaterial.uniforms.uTime.value = state.clock.elapsedTime
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35) * (kind === 'smoke' ? 0.04 : 0.02)
  })

  return (
    <points
      frustumCulled={false}
      geometry={geometry}
      material={material}
      ref={pointsRef}
      renderOrder={LOGO_RENDER_ORDER.particles}
    />
  )
}
