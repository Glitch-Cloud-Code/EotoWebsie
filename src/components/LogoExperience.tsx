import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  NormalBlending,
  Points,
  RepeatWrapping,
  ShaderMaterial,
  type Shape,
} from 'three'
import {
  createParticleAttributes,
  PARTICLE_DEPTH_CLAMP_Z,
  PARTICLE_KIND_SETTINGS,
  sampleBottomEmittersFromTextShapes,
  spreadEmittersAcrossBand,
  type ParticleKind,
  type Point2D,
} from './logoParticles'

type LogoExperienceProps = {
  alt: string
  fallbackSrc: string
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
}

class SceneErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public componentDidCatch() {
    this.props.onError()
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function ParticleField({
  emitters,
  kind,
}: {
  emitters: Point2D[]
  kind: ParticleKind
}) {
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
        depthTest: true,
        blending: kind === 'flame' ? AdditiveBlending : NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window === 'undefined' ? 1 : window.devicePixelRatio },
          uKind: { value: kind === 'flame' ? 0 : 1 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
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
              alpha = softEdge * visibility * (0.36 + pow(inverseLife, 0.7)) * 1.16;
            } else {
              vec3 denseSmoke = vec3(0.1, 0.08, 0.08);
              vec3 lightSmoke = vec3(0.58, 0.5, 0.49);
              color = mix(denseSmoke, lightSmoke, smoothstep(0.0, 1.0, vLife));
              alpha = softEdge * visibility * pow(inverseLife, 1.05) * 0.3;
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

  return <points frustumCulled={false} geometry={geometry} material={material} ref={pointsRef} />
}

function createWornMetalTexture() {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  const gradient = context.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#f7f0e2')
  gradient.addColorStop(0.22, '#cabba6')
  gradient.addColorStop(0.58, '#8f7d6a')
  gradient.addColorStop(1, '#392e27')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  for (let index = 0; index < 16000; index += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    const noise = 45 + Math.random() * 170
    const alpha = 0.045 + Math.random() * 0.16
    context.fillStyle = `rgba(${noise}, ${noise - 8}, ${noise - 18}, ${alpha})`
    context.fillRect(x, y, Math.random() * 5 + 1, Math.random() * 5 + 1)
  }

  for (let index = 0; index < 240; index += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    const width = 120 + Math.random() * 320
    const angle = (Math.random() - 0.5) * 0.85

    context.save()
    context.translate(x, y)
    context.rotate(angle)
    context.fillStyle = `rgba(24, 18, 14, ${0.09 + Math.random() * 0.13})`
    context.fillRect(0, 0, width, Math.random() * 3 + 1)
    context.restore()
  }

  for (let index = 0; index < 42; index += 1) {
    const radius = 16 + Math.random() * 60
    const x = Math.random() * size
    const y = Math.random() * size
    const bloom = context.createRadialGradient(x, y, 0, x, y, radius)
    bloom.addColorStop(0, 'rgba(255,247,235,0.32)')
    bloom.addColorStop(1, 'rgba(255,245,232,0)')
    context.fillStyle = bloom
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  for (let index = 0; index < 12; index += 1) {
    const radius = 38 + Math.random() * 120
    const x = Math.random() * size
    const y = Math.random() * size
    const corrosion = context.createRadialGradient(x, y, 0, x, y, radius)
    corrosion.addColorStop(0, 'rgba(40,22,18,0.32)')
    corrosion.addColorStop(0.65, 'rgba(78,44,32,0.12)')
    corrosion.addColorStop(1, 'rgba(40,22,18,0)')
    context.fillStyle = corrosion
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  const nextTexture = new CanvasTexture(canvas)
  nextTexture.wrapS = RepeatWrapping
  nextTexture.wrapT = RepeatWrapping
  nextTexture.repeat.set(1.2, 1.2)
  nextTexture.needsUpdate = true
  return nextTexture
}

function Model({
  isTouch,
  svgSrc,
}: {
  isTouch: boolean
  svgSrc: string
}) {
  const root = useRef<Group>(null)
  const svg = useLoader(SVGLoader, svgSrc)
  const spinState = useRef({ active: false, startY: 0, elapsed: 0 })
  const targetTilt = useRef({ x: 0, y: 0 })

  const shapes = useMemo(
    () =>
      svg.paths.flatMap((path) => {
        const nextShapes = SVGLoader.createShapes(path)
        return nextShapes
      }),
    [svg],
  )

  const logoLayout = useMemo(() => {
    const sampledPoints = shapes.flatMap((shape) =>
      shape.getSpacedPoints(Math.max(18, Math.floor(shape.getLength() / 10))),
    )

    const bounds = sampledPoints.reduce(
      (accumulator, point) => ({
        maxX: Math.max(accumulator.maxX, point.x),
        maxY: Math.max(accumulator.maxY, point.y),
        minX: Math.min(accumulator.minX, point.x),
        minY: Math.min(accumulator.minY, point.y),
      }),
      {
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
      },
    )

    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const spanY = bounds.maxY - bounds.minY

    const centeredEmitters = sampledPoints.map((point) => ({
      x: point.x - centerX,
      y: point.y - centerY,
    }))

    const textBottomEmitters = sampleBottomEmittersFromTextShapes(shapes, centerX, centerY)
    const smokeBandPoints = centeredEmitters.filter((point) => Math.abs(point.y) < spanY * 0.18)

    return {
      centerX,
      centerY,
      flameEmitters:
        textBottomEmitters.length > 0
          ? spreadEmittersAcrossBand(textBottomEmitters, 46, 'bottom')
          : spreadEmittersAcrossBand(centeredEmitters, 38, 'bottom'),
      smokeEmitters:
        smokeBandPoints.length > 0
          ? spreadEmittersAcrossBand(smokeBandPoints, 22, 'center')
          : spreadEmittersAcrossBand(centeredEmitters, 22, 'center'),
    }
  }, [shapes])

  const texture = useMemo(() => createWornMetalTexture(), [])

  const material = useMemo(
    () => {
      const nextMaterial = new MeshPhysicalMaterial({
        color: '#dfd4c1',
        metalness: 1,
        roughness: 0.34,
        clearcoat: 0.18,
        clearcoatRoughness: 0.42,
        reflectivity: 1,
        emissive: '#220809',
        emissiveIntensity: 0.18,
        side: DoubleSide,
      })

      if (texture) {
        nextMaterial.map = texture
        nextMaterial.roughnessMap = texture
        nextMaterial.bumpMap = texture
        nextMaterial.bumpScale = 1.8
      }

      return nextMaterial
    },
    [texture],
  )

  const geometries = useMemo(
    () =>
      shapes.map(
        (shape: Shape) => {
          const geometry = new ExtrudeGeometry(shape, {
            depth: 30,
            bevelEnabled: true,
            bevelSegments: 3,
            bevelSize: 2.4,
            bevelThickness: 2.4,
            curveSegments: 24,
            steps: 1,
          })

          geometry.translate(-logoLayout.centerX, -logoLayout.centerY, -15)
          return geometry
        },
      ),
    [logoLayout.centerX, logoLayout.centerY, shapes],
  )

  useEffect(() => {
    return () => {
      geometries.forEach((geometry) => geometry.dispose())
      material.dispose()
      texture?.dispose()
    }
  }, [geometries, material, texture])

  useFrame((state, delta) => {
    const current = root.current
    if (!current) {
      return
    }

    if (!isTouch) {
      targetTilt.current.x = MathUtils.clamp(-state.pointer.y * 0.15, -0.15, 0.15)
      targetTilt.current.y = MathUtils.clamp(-state.pointer.x * 0.28, -0.28, 0.28)
    } else {
      targetTilt.current.x = 0
      targetTilt.current.y = 0
    }

    if (spinState.current.active) {
      spinState.current.elapsed += delta
      const progress = Math.min(spinState.current.elapsed / 1.15, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      current.rotation.x = MathUtils.lerp(current.rotation.x, targetTilt.current.x, delta * 4)
      current.rotation.y = spinState.current.startY + eased * Math.PI * 2

      if (progress >= 1) {
        current.rotation.y -= Math.PI * 2
        spinState.current.active = false
      }

      return
    }

    current.rotation.x = MathUtils.lerp(current.rotation.x, targetTilt.current.x, delta * 3.8)
    current.rotation.y = MathUtils.lerp(current.rotation.y, targetTilt.current.y, delta * 3.8)
  })

  return (
    <group
      onClick={() => {
        if (!spinState.current.active && root.current) {
          spinState.current.active = true
          spinState.current.startY = root.current.rotation.y
          spinState.current.elapsed = 0
        }
      }}
      onPointerDown={() => {
        if (!spinState.current.active && root.current) {
          spinState.current.active = true
          spinState.current.startY = root.current.rotation.y
          spinState.current.elapsed = 0
        }
      }}
      ref={root}
    >
      <group scale={[0.031, -0.031, 0.031]}>
        <ParticleField emitters={logoLayout.smokeEmitters} kind="smoke" />
        <ParticleField emitters={logoLayout.flameEmitters} kind="flame" />
        {geometries.map((geometry, index) => (
          <mesh
            castShadow
            geometry={geometry}
            key={index}
            material={material}
            receiveShadow
          />
        ))}
      </group>
    </group>
  )
}

function Loader() {
  return (
    <Html center>
      <div className="logo-loader">Loading mark</div>
    </Html>
  )
}

export function LogoExperience({ alt, fallbackSrc }: LogoExperienceProps) {
  const [hasError, setHasError] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(pointer: coarse)')
    const update = () => setIsTouch(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const supportsWebGL =
    typeof window !== 'undefined' &&
    'WebGLRenderingContext' in window &&
    !!document.createElement('canvas').getContext('webgl')

  if (hasError || !supportsWebGL) {
    return (
      <div className="logo-fallback-shell">
        <img alt={alt} className="logo-fallback-image" src={fallbackSrc} />
      </div>
    )
  }

  return (
    <SceneErrorBoundary
      fallback={
        <div className="logo-fallback-shell">
          <img alt={alt} className="logo-fallback-image" src={fallbackSrc} />
        </div>
      }
      onError={() => setHasError(true)}
    >
      <div className="logo-canvas-shell">
        <Canvas camera={{ fov: 26, position: [0, 0, 170] }} dpr={[1, 2]} gl={{ alpha: true }}>
          <fog args={['#0a0708', 95, 255]} attach="fog" />
          <ambientLight intensity={1.45} />
          <directionalLight color="#fff4df" intensity={7.2} position={[42, 55, 86]} />
          <directionalLight color="#cf202a" intensity={3.4} position={[-58, -10, 72]} />
          <directionalLight color="#fff9f0" intensity={2.8} position={[0, 28, 118]} />
          <pointLight color="#ffd9b8" intensity={3200} position={[0, 12, 82]} />
          <pointLight color="#7b1015" intensity={2100} position={[-22, -8, 58]} />
          <spotLight
            angle={0.4}
            color="#b71d25"
            intensity={32000}
            penumbra={1}
            position={[0, -64, 102]}
          />

          <Suspense fallback={<Loader />}>
            <Model isTouch={isTouch} svgSrc={fallbackSrc} />
          </Suspense>

          <ContactShadows blur={2.8} color="#26090c" opacity={0.42} position={[0, -58, 0]} />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}
