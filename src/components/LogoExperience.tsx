import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
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
          <LogoScene
            globalPointer={globalPointer}
            isTouch={isTouch}
            modelSrc={`${import.meta.env.BASE_URL}assets/logo/logo.glb`}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}
