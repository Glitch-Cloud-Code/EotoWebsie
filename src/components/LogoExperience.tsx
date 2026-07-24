import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { installLogoSceneProbe } from './logoDiagnostics'
import { LogoScene } from './LogoScene'
import { normalizeViewportPointer, type PointerTarget } from './logoPointer'
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

export function LogoExperience({ alt, fallbackSrc }: LogoExperienceProps) {
  const globalPointer = useRef<PointerTarget>({ x: 0, y: 0 })
  const [hasError, setHasError] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [spinRequest, setSpinRequest] = useState(0)
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

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updatePointer = (event: PointerEvent) => {
      if (prefersReducedMotion) {
        globalPointer.current = { x: 0, y: 0 }
        return
      }

      globalPointer.current = normalizeViewportPointer(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
    }

    window.addEventListener('pointermove', updatePointer, { passive: true })
    return () => window.removeEventListener('pointermove', updatePointer)
  }, [prefersReducedMotion])

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
      <div
        aria-label={
          prefersReducedMotion
            ? 'Echoes Of The Orion three-dimensional logo'
            : 'Interactive Echoes Of The Orion logo. Press Enter or Space to rotate.'
        }
        className="logo-canvas-shell"
        onKeyDown={(event) => {
          if (
            !prefersReducedMotion &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault()
            setSpinRequest((current) => current + 1)
          }
        }}
        role={prefersReducedMotion ? 'img' : 'button'}
        tabIndex={prefersReducedMotion ? -1 : 0}
      >
        <Canvas
          camera={{ fov: 26, position: [0, 0, 170] }}
          dpr={[1, 2]}
          gl={glOptions}
          onCreated={({ camera, gl, scene }) =>
            installLogoSceneProbe(scene, camera, gl)
          }
        >
          <LogoScene
            globalPointer={globalPointer}
            isTouch={isTouch}
            modelSrc={`${import.meta.env.BASE_URL}assets/logo/logo.glb`}
            reduceMotion={prefersReducedMotion}
            spinRequest={spinRequest}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}
