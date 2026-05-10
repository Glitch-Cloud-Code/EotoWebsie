import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, type ThreeEvent, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
  DoubleSide,
  Euler,
  Group,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  SpotLight as ThreeSpotLight,
  Vector3,
} from 'three'
import { ParticleField } from './ParticleField'
import { SparkBurst } from './SparkBurst'
import { buildLogoLayout, createLogoGeometries, LOGO_HITBOX_DEPTH } from './logoGeometry'
import {
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
  type SpotLogoLight,
} from './logoLighting'
import { LOGO_RENDER_ORDER } from './logoParticles'
import { getFlickSpinAxis, getLogoTiltFromPointer, normalizeViewportPointer, type PointerTarget } from './logoPointer'
import {
  findNearestLogoSurfacePoint,
  LOGO_MODEL_SCALE,
  toLogoLocalClickPoint,
  toLogoScenePoint,
  type Point3D,
} from './logoSparks'
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
  const spinState = useRef({
    active: false,
    axis: new Vector3(0, 1, 0),
    elapsed: 0,
    startQuaternion: new Quaternion(),
  })
  const spinQuaternion = useRef(new Quaternion())
  const sparkId = useRef(0)
  const [sparkBursts, setSparkBursts] = useState<{ id: number; origin: Point3D }[]>([])
  const scratchVector = useRef(new Vector3())
  const targetTilt = useRef({ x: 0, y: 0 })
  const targetTiltEuler = useRef(new Euler(0, 0, 0, 'XYZ'))
  const targetTiltQuaternion = useRef(new Quaternion())

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

      spinQuaternion.current.setFromAxisAngle(spinState.current.axis, eased * Math.PI * 2)
      current.quaternion.copy(spinState.current.startQuaternion).premultiply(spinQuaternion.current)

      if (progress >= 1) {
        current.quaternion.copy(spinState.current.startQuaternion)
        spinState.current.active = false
      }

      return
    }

    targetTiltEuler.current.set(targetTilt.current.x, targetTilt.current.y, 0)
    targetTiltQuaternion.current.setFromEuler(targetTiltEuler.current)
    current.quaternion.slerp(targetTiltQuaternion.current, Math.min(delta * 3.8, 1))
  })

  const removeSparkBurst = (id: number) => {
    setSparkBursts((currentBursts) => currentBursts.filter((burst) => burst.id !== id))
  }

  const addSparkBurst = (eventPoint: Vector3) => {
    if (!root.current) {
      return
    }

    const rootLocalClick = root.current.worldToLocal(scratchVector.current.copy(eventPoint))
    const clickPoint = toLogoLocalClickPoint(rootLocalClick)
    const nearestPoint = findNearestLogoSurfacePoint(logoLayout.surfacePoints, clickPoint)
    const rootLocalOrigin = toLogoScenePoint(nearestPoint)
    const worldOrigin = root.current.localToWorld(scratchVector.current.set(rootLocalOrigin.x, rootLocalOrigin.y, rootLocalOrigin.z))
    const nextBurst = {
      id: sparkId.current,
      origin: {
        x: worldOrigin.x,
        y: worldOrigin.y,
        z: worldOrigin.z,
      },
    }

    sparkId.current += 1
    setSparkBursts((currentBursts) => [...currentBursts.slice(-5), nextBurst])
  }

  const startSpin = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    addSparkBurst(event.point)

    if (!spinState.current.active && root.current) {
      const axis = getFlickSpinAxis({ x: event.point.x, y: event.point.y })

      spinState.current.active = true
      spinState.current.axis.set(axis.x, axis.y, axis.z)
      spinState.current.elapsed = 0
      spinState.current.startQuaternion.copy(root.current.quaternion)
    }
  }

  return (
    <>
      <group onPointerDown={startSpin} ref={root}>
        <group scale={[LOGO_MODEL_SCALE, -LOGO_MODEL_SCALE, LOGO_MODEL_SCALE]}>
          <mesh>
            <boxGeometry args={[logoLayout.width, logoLayout.height, LOGO_HITBOX_DEPTH]} />
            <meshBasicMaterial depthWrite={false} opacity={0} transparent />
          </mesh>
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
      {sparkBursts.map((burst) => (
        <group key={burst.id} position={[burst.origin.x, burst.origin.y, burst.origin.z]} scale={[LOGO_MODEL_SCALE, -LOGO_MODEL_SCALE, LOGO_MODEL_SCALE]}>
          <SparkBurst id={burst.id} onComplete={removeSparkBurst} origin={{ x: 0, y: 0, z: 0 }} />
        </group>
      ))}
    </>
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
