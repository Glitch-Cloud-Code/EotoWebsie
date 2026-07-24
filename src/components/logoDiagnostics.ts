import type { Scene } from 'three'

declare global {
  interface Window {
    __EOTO_LOGO_SCENE__?: Scene
  }
}

export function installLogoSceneProbe(scene: Scene) {
  if (import.meta.env.DEV) {
    window.__EOTO_LOGO_SCENE__ = scene
  }
}
