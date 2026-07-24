import { Suspense, useLayoutEffect, useRef, type RefObject } from 'react'
import { ContactShadows, Html } from '@react-three/drei'
import { Object3D, SpotLight as ThreeSpotLight } from 'three'
import {
  type SpotLogoLight,
} from './logoLighting'
import { LogoEnvironment } from './LogoEnvironment'
import {
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
} from './logoSceneConfig'
import { LogoModel } from './LogoModel'
import type { PointerTarget } from './logoPointer'

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

function Loader() {
  return (
    <Html center>
      <div className="logo-loader">Loading mark</div>
    </Html>
  )
}

type LogoSceneProps = {
  globalPointer: RefObject<PointerTarget>
  isTouch: boolean
  modelSrc: string
  reduceMotion: boolean
  spinRequest: number
}

export function LogoScene({
  globalPointer,
  isTouch,
  modelSrc,
  reduceMotion,
  spinRequest,
}: LogoSceneProps) {
  return (
    <>
      <fog args={['#0a0708', 95, 255]} attach="fog" />
      <ambientLight intensity={LOGO_AMBIENT_LIGHT.intensity} />
      <hemisphereLight
        color={LOGO_HEMISPHERE_LIGHT.color}
        groundColor={LOGO_HEMISPHERE_LIGHT.groundColor}
        intensity={LOGO_HEMISPHERE_LIGHT.intensity}
      />
      <LogoEnvironment />
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
        <LogoModel
          globalPointer={globalPointer}
          isTouch={isTouch}
          modelSrc={modelSrc}
          reduceMotion={reduceMotion}
          spinRequest={spinRequest}
        />
      </Suspense>
      <ContactShadows blur={2.8} color="#26090c" opacity={0.28} position={[0, -58, 0]} />
    </>
  )
}
