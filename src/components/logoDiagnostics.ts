import type { Camera, Scene, WebGLRenderer } from 'three'

declare global {
  interface Window {
    __EOTO_LOGO_SCENE__?: Scene
    __EOTO_RENDER_LOGO_FRAME__?: () => void
  }
}

export function installLogoSceneProbe(
  scene: Scene,
  camera: Camera,
  renderer: WebGLRenderer,
) {
  if (import.meta.env.DEV) {
    window.__EOTO_LOGO_SCENE__ = scene
    window.__EOTO_RENDER_LOGO_FRAME__ = () => renderer.render(scene, camera)
  }
}
