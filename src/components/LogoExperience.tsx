import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Center, ContactShadows, Html } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  RepeatWrapping,
  type Shape,
} from 'three'

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

  const texture = useMemo(() => {
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
  }, [])

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
        (shape: Shape) =>
          new ExtrudeGeometry(shape, {
            depth: 30,
            bevelEnabled: true,
            bevelSegments: 3,
            bevelSize: 2.4,
            bevelThickness: 2.4,
            curveSegments: 24,
            steps: 1,
          }),
      ),
    [shapes],
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
      <Center scale={[0.031, -0.031, 0.031]}>
        {geometries.map((geometry, index) => (
          <mesh
            castShadow
            geometry={geometry}
            key={index}
            material={material}
            receiveShadow
          />
        ))}
      </Center>
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
