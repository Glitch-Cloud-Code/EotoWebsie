import { describe, expect, it, vi } from 'vitest'
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { installLogoSceneProbe } from './logoDiagnostics'

type ProbeTarget = {
  __EOTO_LOGO_CAMERA__?: PerspectiveCamera
  __EOTO_LOGO_SCENE__?: Scene
  __EOTO_RENDER_LOGO_FRAME__?: () => void
}

describe('logo diagnostics', () => {
  it('cleans up only the scene probe it installed', () => {
    const camera = new PerspectiveCamera()
    const scene = new Scene()
    const renderer = {
      render: vi.fn(),
    } as unknown as WebGLRenderer
    const target: ProbeTarget = {}

    const cleanup = installLogoSceneProbe(scene, camera, renderer, target)
    target.__EOTO_RENDER_LOGO_FRAME__?.()

    expect(target.__EOTO_LOGO_CAMERA__).toBe(camera)
    expect(target.__EOTO_LOGO_SCENE__).toBe(scene)
    expect(renderer.render).toHaveBeenCalledWith(scene, camera)

    cleanup()

    expect(target).toEqual({})
  })

  it('does not erase a newer probe during stale cleanup', () => {
    const firstCamera = new PerspectiveCamera()
    const firstScene = new Scene()
    const secondCamera = new PerspectiveCamera()
    const secondScene = new Scene()
    const renderer = {
      render: vi.fn(),
    } as unknown as WebGLRenderer
    const target: ProbeTarget = {}

    const cleanupFirst = installLogoSceneProbe(
      firstScene,
      firstCamera,
      renderer,
      target,
    )
    installLogoSceneProbe(secondScene, secondCamera, renderer, target)

    cleanupFirst()

    expect(target.__EOTO_LOGO_CAMERA__).toBe(secondCamera)
    expect(target.__EOTO_LOGO_SCENE__).toBe(secondScene)
  })
})
