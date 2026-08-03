import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useGLTF } from '@react-three/drei'
import { Group } from 'three'
import logoMetadata from '../assets/logoMetadata.json'
import { AttachedLogoEffects, DetachedLogoEffects } from './LogoEffects'
import { prepareLogoScene } from './logoAsset'
import type { LogoLayout } from './logoGeometry'
import { LogoMesh } from './LogoMesh'
import { createForgedMetalMaterial } from './logoMaterial'
import type { LogoQuality } from './logoQuality'
import type { PointerTarget } from './logoPointer'
import {
  LOGO_EFFECTS_TRANSFORM_SCALE,
  LOGO_MODEL_TRANSFORM_SCALE,
} from './logoSparks'
import { useLogoInteraction } from './useLogoInteraction'

type LogoModelProps = {
  globalPointer: RefObject<PointerTarget>
  isTouch: boolean
  modelSrc: string
  quality: LogoQuality
  reduceMotion: boolean
  spinRequest: number
}

const logoLayout: LogoLayout = logoMetadata

export function LogoModel({
  globalPointer,
  isTouch,
  modelSrc,
  quality,
  reduceMotion,
  spinRequest,
}: LogoModelProps) {
  const root = useRef<Group>(null)
  const { scene: sourceScene } = useGLTF(modelSrc)
  const material = useMemo(() => createForgedMetalMaterial(), [])
  const glbScene = useMemo(
    () => prepareLogoScene(sourceScene, material),
    [material, sourceScene],
  )
  const { removeSparkBurst, sparkBursts, startSpin } = useLogoInteraction({
    globalPointer,
    isTouch,
    logoLayout,
    reduceMotion,
    root,
    spinRequest,
  })

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <>
      <group name="logo-rotating-root" ref={root}>
        <group name="logo-glb-transform" scale={LOGO_MODEL_TRANSFORM_SCALE}>
          <LogoMesh
            glbScene={glbScene}
            logoLayout={logoLayout}
            onPointerDown={startSpin}
          />
        </group>
        {!reduceMotion ? (
          <group name="logo-svg-effects-transform" scale={LOGO_EFFECTS_TRANSFORM_SCALE}>
            <AttachedLogoEffects logoLayout={logoLayout} quality={quality} />
          </group>
        ) : null}
      </group>
      <DetachedLogoEffects
        logoLayout={logoLayout}
        onSparkComplete={removeSparkBurst}
        reduceMotion={reduceMotion}
        sparkBursts={sparkBursts}
      />
    </>
  )
}
