import {
  AdditiveBlending,
  NormalBlending,
} from 'three'
import { describe, expect, it } from 'vitest'
import { createParticleMaterial } from './logoParticleMaterial'
import { PARTICLE_KIND_SETTINGS } from './logoParticles'

describe('logo particle material', () => {
  it.each([
    ['flame', AdditiveBlending],
    ['smoke', NormalBlending],
  ] as const)('owns %s settings through uniforms', (kind, blending) => {
    const material = createParticleMaterial(kind, 1.5)

    expect(material.name).toBe(`logo-${kind}-particles`)
    expect(material.blending).toBe(blending)
    expect(material.depthTest).toBe(PARTICLE_KIND_SETTINGS[kind].depthTest)
    expect(material.uniforms.uAlphaMultiplier.value).toBe(
      PARTICLE_KIND_SETTINGS[kind].alphaMultiplier,
    )
    expect(material.uniforms.uFadeOutStart.value).toBe(
      PARTICLE_KIND_SETTINGS[kind].fadeOutStart,
    )
    expect(material.uniforms.uPixelRatio.value).toBe(1.5)
    expect(material.vertexShader).toContain('uniform float uFadeOutStart')
    expect(material.fragmentShader).toContain('uniform float uFadeOutStart')

    material.dispose()
  })
})
