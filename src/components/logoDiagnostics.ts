import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { Camera, Scene, WebGLRenderer } from 'three'

declare global {
  interface Window {
    __EOTO_LOGO_CAMERA__?: Camera
    __EOTO_LOGO_SCENE__?: Scene
    __EOTO_RENDER_LOGO_FRAME__?: () => void
  }
}

export function installLogoSceneProbe(
  scene: Scene,
  camera: Camera,
  renderer: WebGLRenderer,
  target: Pick<
    Window,
    | '__EOTO_LOGO_CAMERA__'
    | '__EOTO_LOGO_SCENE__'
    | '__EOTO_RENDER_LOGO_FRAME__'
  > = window,
) {
  if (!import.meta.env.DEV) {
    return () => undefined
  }

  const renderFrame = () => renderer.render(scene, camera)
  target.__EOTO_LOGO_CAMERA__ = camera
  target.__EOTO_LOGO_SCENE__ = scene
  target.__EOTO_RENDER_LOGO_FRAME__ = renderFrame

  return () => {
    if (target.__EOTO_LOGO_CAMERA__ === camera) {
      delete target.__EOTO_LOGO_CAMERA__
    }
    if (target.__EOTO_LOGO_SCENE__ === scene) {
      delete target.__EOTO_LOGO_SCENE__
    }
    if (target.__EOTO_RENDER_LOGO_FRAME__ === renderFrame) {
      delete target.__EOTO_RENDER_LOGO_FRAME__
    }
  }
}

export function LogoDiagnostics() {
  const camera = useThree((state) => state.camera)
  const renderer = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(
    () => installLogoSceneProbe(scene, camera, renderer),
    [camera, renderer, scene],
  )

  return null
}
