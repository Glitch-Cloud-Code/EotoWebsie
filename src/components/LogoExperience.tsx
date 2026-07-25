import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import logoMetadata from '../assets/logoMetadata.json'
import { LogoCamera } from './LogoCamera'
import {
  getLogoCameraDistance,
  LOGO_CAMERA_FOV,
} from './logoCameraLayout'
import { LogoDiagnostics } from './logoDiagnostics'
import { LogoScene } from './LogoScene'
import { normalizeViewportPointer, type PointerTarget } from './logoPointer'
import { getLogoDpr, type LogoQuality } from './logoQuality'
import { SceneErrorBoundary } from './SceneErrorBoundary'
import { useElementVisibility } from './useElementVisibility'

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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

export function LogoExperience({ alt, fallbackSrc }: LogoExperienceProps) {
  const globalPointer = useRef<PointerTarget>({ x: 0, y: 0 })
  const [hasError, setHasError] = useState(false)
  const [spinRequest, setSpinRequest] = useState(0)
  const isTouch = useMediaQuery('(pointer: coarse)')
  const isNarrow = useMediaQuery('(max-width: 720px)')
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  )
  const { elementRef, isVisible } =
    useElementVisibility<HTMLDivElement>('120px')
  const quality: LogoQuality = isTouch || isNarrow ? 'low' : 'high'
  const frameLoop = prefersReducedMotion
    ? 'demand'
    : isVisible
      ? 'always'
      : 'never'
  const canUseWebGL = useMemo(() => supportsWebGL(), [])
  const glOptions = useMemo(
    () => ({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance' as const,
      preserveDrawingBuffer: !import.meta.env.PROD,
    }),
    [],
  )
  const initialCamera = useMemo(
    () => ({
      fov: LOGO_CAMERA_FOV,
      position: [
        0,
        0,
        getLogoCameraDistance(
          logoMetadata.width,
          logoMetadata.height,
          quality,
        ),
      ] as [number, number, number],
    }),
    [quality],
  )

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
        data-logo-quality={quality}
        data-rendering={frameLoop === 'never' ? 'paused' : 'active'}
        data-spin-request={spinRequest}
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
        ref={elementRef}
        tabIndex={prefersReducedMotion ? -1 : 0}
      >
        <Canvas
          camera={initialCamera}
          dpr={getLogoDpr(quality)}
          frameloop={frameLoop}
          gl={glOptions}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
          }}
        >
          <LogoDiagnostics />
          <LogoCamera
            height={logoMetadata.height}
            quality={quality}
            width={logoMetadata.width}
          />
          <LogoScene
            globalPointer={globalPointer}
            isTouch={isTouch}
            modelSrc={`${import.meta.env.BASE_URL}assets/logo/logo.glb`}
            quality={quality}
            reduceMotion={prefersReducedMotion}
            spinRequest={spinRequest}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}
