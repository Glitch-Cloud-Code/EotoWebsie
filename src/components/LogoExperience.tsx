import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { DoubleSide, Group, MathUtils, MeshPhysicalMaterial, Object3D, SpotLight as ThreeSpotLight } from 'three'
import { ParticleField } from './ParticleField'
import { buildLogoLayout, createLogoGeometries } from './logoGeometry'
import {
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
  type SpotLogoLight,
} from './logoLighting'
import { LOGO_RENDER_ORDER } from './logoParticles'
import { getLogoTiltFromPointer, normalizeViewportPointer, type PointerTarget } from './logoPointer'
import { createWornMetalTexture } from './logoTexture'
import { SceneErrorBoundary } from './SceneErrorBoundary'

type LogoExperienceProps = {
  alt: string
  fallbackSrc: string
}

function supportsWebGL() {
  if (typeof window === 'undefined') {
    return false
  }

  const canvas = document.createElement('canvas')
  return 'WebGLRenderingContext' in window && !!canvas.getContext('webgl')
}

function LogoSpotLight({ light }: { light: SpotLogoLight }) {
  const lightRef = useRef<ThreeSpotLight>(null)
  const targetRef = useRef<Object3D>(null)

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) {
      return
    }

    lightRef.current.target = targetRef.current
    lightRef.current.target.updateMatrixWorld()
  }, [])

  return (
    <>
      <object3D position={light.target} ref={targetRef} />
      <spotLight
        angle={light.angle}
        color={light.color}
        intensity={light.intensity}
        penumbra={light.penumbra}
        position={light.position}
        ref={lightRef}
      />
    </>
  )
}

function Model({
  globalPointer,
  isTouch,
  svgSrc,
}: {
  globalPointer: RefObject<PointerTarget>
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
  const logoLayout = useMemo(() => buildLogoLayout(shapes), [shapes])
  const texture = useMemo(() => createWornMetalTexture(), [])

  const material = useMemo(() => {
    const nextMaterial = new MeshPhysicalMaterial({
      color: '#fff5df',
      metalness: 1,
      roughness: 0.27,
      clearcoat: 0.32,
      clearcoatRoughness: 0.34,
      reflectivity: 1,
      emissive: '#37120d',
      emissiveIntensity: 0.24,
      side: DoubleSide,
    })

    if (texture) {
      nextMaterial.map = texture
      nextMaterial.roughnessMap = texture
      nextMaterial.bumpMap = texture
      nextMaterial.bumpScale = 1.8
    }

    return nextMaterial
  }, [texture])

  const textOverlayMaterial = useMemo(() => {
    const nextMaterial = material.clone()
    nextMaterial.transparent = true
    nextMaterial.opacity = 1
    nextMaterial.depthTest = false
    nextMaterial.depthWrite = false
    nextMaterial.emissiveIntensity = 0.38
    return nextMaterial
  }, [material])

  const geometries = useMemo(() => createLogoGeometries(shapes, logoLayout), [logoLayout, shapes])

  useEffect(() => {
    return () => {
      geometries.forEach(({ geometry }) => geometry.dispose())
      material.dispose()
      textOverlayMaterial.dispose()
      texture?.dispose()
    }
  }, [geometries, material, textOverlayMaterial, texture])

  useFrame((_, delta) => {
    const current = root.current
    if (!current) {
      return
    }

    if (!isTouch) {
      const tilt = getLogoTiltFromPointer(globalPointer.current)
      targetTilt.current.x = tilt.x
      targetTilt.current.y = tilt.y
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

  const startSpin = () => {
    if (!spinState.current.active && root.current) {
      spinState.current.active = true
      spinState.current.startY = root.current.rotation.y
      spinState.current.elapsed = 0
    }
  }

  return (
    <group onClick={startSpin} onPointerDown={startSpin} ref={root}>
      <group scale={[0.031, -0.031, 0.031]}>
        <ParticleField emitters={logoLayout.smokeEmitters} kind="smoke" />
        <ParticleField emitters={logoLayout.flameEmitters} kind="flame" />
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
  const globalPointer = useRef<PointerTarget>({ x: 0, y: 0 })
  const [hasError, setHasError] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const canUseWebGL = useMemo(() => supportsWebGL(), [])
  const glOptions = useMemo(
    () => ({
      alpha: true,
      preserveDrawingBuffer: !import.meta.env.PROD,
    }),
    [],
  )

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updatePointer = (event: PointerEvent) => {
      globalPointer.current = normalizeViewportPointer(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
    }

    window.addEventListener('pointermove', updatePointer, { passive: true })
    return () => window.removeEventListener('pointermove', updatePointer)
  }, [])

  if (hasError || !canUseWebGL) {
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
        <Canvas camera={{ fov: 26, position: [0, 0, 170] }} dpr={[1, 2]} gl={glOptions}>
          <fog args={['#0a0708', 95, 255]} attach="fog" />
          <ambientLight intensity={LOGO_AMBIENT_LIGHT.intensity} />
          <hemisphereLight
            color={LOGO_HEMISPHERE_LIGHT.color}
            groundColor={LOGO_HEMISPHERE_LIGHT.groundColor}
            intensity={LOGO_HEMISPHERE_LIGHT.intensity}
          />
          {LOGO_DIRECTIONAL_LIGHTS.map((light) => (
            <directionalLight
              color={light.color}
              intensity={light.intensity}
              key={light.key}
              position={light.position}
            />
          ))}
          {LOGO_POINT_LIGHTS.map((light) => (
            <pointLight
              color={light.color}
              intensity={light.intensity}
              key={light.key}
              position={light.position}
            />
          ))}
          {LOGO_SPOT_LIGHTS.map((light) => (
            <LogoSpotLight key={light.key} light={light} />
          ))}

          <Suspense fallback={<Loader />}>
            <Model globalPointer={globalPointer} isTouch={isTouch} svgSrc={fallbackSrc} />
          </Suspense>

          <ContactShadows blur={2.8} color="#26090c" opacity={0.42} position={[0, -58, 0]} />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}
