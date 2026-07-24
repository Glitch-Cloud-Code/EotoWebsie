import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useGLTF } from '@react-three/drei'
import { DoubleSide, Group, MeshPhysicalMaterial } from 'three'
import logoMetadata from '../assets/logoMetadata.json'
import { AttachedLogoEffects, DetachedLogoEffects } from './LogoEffects'
import { prepareLogoScene } from './logoAsset'
import type { LogoLayout } from './logoGeometry'
import { LogoMesh } from './LogoMesh'
import type { PointerTarget } from './logoPointer'
import { LOGO_MODEL_SCALE } from './logoSparks'
import { createWornMetalTexture } from './logoTexture'
import { useLogoInteraction } from './useLogoInteraction'

type LogoModelProps = {
  globalPointer: RefObject<PointerTarget>
  isTouch: boolean
  modelSrc: string
}

const logoLayout: LogoLayout = logoMetadata

export function LogoModel({ globalPointer, isTouch, modelSrc }: LogoModelProps) {
  const root = useRef<Group>(null)
  const { scene: sourceScene } = useGLTF(modelSrc)
  const texture = useMemo(() => createWornMetalTexture(), [])
  const material = useMemo(() => {
    const nextMaterial = new MeshPhysicalMaterial({
      clearcoat: 0.32,
      clearcoatRoughness: 0.34,
      color: '#fff5df',
      emissive: '#37120d',
      emissiveIntensity: 0.24,
      metalness: 1,
      reflectivity: 1,
      roughness: 0.27,
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
  const glbScene = useMemo(
    () => prepareLogoScene(sourceScene, material),
    [material, sourceScene],
  )
  const highlightMaterial = useMemo(() => {
    const nextMaterial = material.clone()
    nextMaterial.depthTest = false
    nextMaterial.depthWrite = false
    nextMaterial.emissive.set('#6b2417')
    nextMaterial.emissiveIntensity = 0.46
    nextMaterial.opacity = 0.34
    nextMaterial.transparent = true
    return nextMaterial
  }, [material])
  const highlightScene = useMemo(
    () => prepareLogoScene(sourceScene, highlightMaterial),
    [highlightMaterial, sourceScene],
  )
  const { removeSparkBurst, sparkBursts, startSpin } = useLogoInteraction({
    globalPointer,
    isTouch,
    logoLayout,
    root,
  })

  useEffect(() => {
    return () => {
      material.dispose()
      highlightMaterial.dispose()
      texture?.dispose()
    }
  }, [highlightMaterial, material, texture])

  return (
    <>
      <group name="logo-rotating-root" ref={root}>
        <group scale={[LOGO_MODEL_SCALE, -LOGO_MODEL_SCALE, LOGO_MODEL_SCALE]}>
          <LogoMesh
            glbScene={glbScene}
            highlightScene={highlightScene}
            logoLayout={logoLayout}
            onPointerDown={startSpin}
          />
          <AttachedLogoEffects logoLayout={logoLayout} />
        </group>
      </group>
      <DetachedLogoEffects
        logoLayout={logoLayout}
        onSparkComplete={removeSparkBurst}
        sparkBursts={sparkBursts}
      />
    </>
  )
}
