import { AdditiveBlending, DoubleSide } from 'three'
import { describe, expect, it } from 'vitest'
import { createGodRayMaterial } from './logoGodRayMaterial'
import {
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_BEND,
  LOGO_GOD_RAY_DEPTH_SWAY,
  LOGO_GOD_RAY_EDGE_FADE_NDC,
  LOGO_GOD_RAY_HAZE_ALPHA,
  LOGO_GOD_RAY_LIFECYCLE_SECONDS,
  LOGO_GOD_RAY_REDUCED_TIME,
  LOGO_GOD_RAY_WORDMARK_MIN_ALPHA,
  LOGO_GOD_RAY_WIDTH_PULSE,
} from './logoGodRays'

describe('GodRays material', () => {
  it('uses additive depth-aware volumetric-style compositing', () => {
    const material = createGodRayMaterial({ logoHeight: 200 })

    expect(material.blending).toBe(AdditiveBlending)
    expect(material.depthTest).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.side).toBe(DoubleSide)
    expect(material.toneMapped).toBe(false)
    expect(material.transparent).toBe(true)
    expect(material.name).toBe('logo-god-rays-defined')
    expect(material.fragmentShader).toContain(LOGO_GOD_RAY_ALPHA.toFixed(2))
    expect(material.vertexShader).toContain('uniform float uTime')
    expect(material.vertexShader).toContain('aAlong')
    expect(material.vertexShader).toContain('aAcross')
    expect(material.vertexShader).toContain('aLifecycleSeed')
    expect(material.vertexShader).toContain('aLifecycleRate')
    expect(material.vertexShader).toContain('aMotionRate')
    expect(material.vertexShader).toContain('aDepthLayer')
    expect(material.vertexShader).toContain('currentA')
    expect(material.vertexShader).toContain('currentB')
    expect(material.vertexShader).toContain('currentC')
    expect(material.vertexShader).toContain(LOGO_GOD_RAY_BEND.toFixed(1))
    expect(material.vertexShader).toContain(
      LOGO_GOD_RAY_DEPTH_SWAY.toFixed(1),
    )
    expect(material.vertexShader).toContain(
      LOGO_GOD_RAY_WIDTH_PULSE.toFixed(2),
    )
    expect(material.fragmentShader).toContain('fbm')
    expect(material.fragmentShader).toContain('broadDensity')
    expect(material.fragmentShader).toContain('fineDensity')
    expect(material.fragmentShader).toContain('breakup')
    expect(material.fragmentShader).toContain('caustic')
    expect(material.fragmentShader).toContain('surfaceRefraction')
    expect(material.fragmentShader).toContain('extinction')
    expect(material.fragmentShader).toContain('lifecycleCycle')
    expect(material.fragmentShader).toContain('forming')
    expect(material.fragmentShader).toContain('collapsing')
    expect(material.fragmentShader).toContain(
      LOGO_GOD_RAY_LIFECYCLE_SECONDS.toFixed(1),
    )
    expect(material.fragmentShader).toContain('steelCore')
    expect(material.fragmentShader).toContain('wordmarkReadability')
    expect(material.fragmentShader).toContain('screenEdgeFade')
    expect(material.fragmentShader).toContain(
      LOGO_GOD_RAY_EDGE_FADE_NDC.toFixed(2),
    )
    expect(material.fragmentShader).toContain(
      LOGO_GOD_RAY_WORDMARK_MIN_ALPHA.toFixed(2),
    )

    material.dispose()
  })

  it('provides a broader low-alpha haze pass', () => {
    const haze = createGodRayMaterial({
      logoHeight: 200,
      profile: 'haze',
    })

    expect(haze.fragmentShader).toContain(LOGO_GOD_RAY_HAZE_ALPHA.toFixed(2))
    expect(haze.name).toBe('logo-god-rays-haze')
    expect(haze.vertexShader).toContain('aAcross * 2.4')
    expect(haze.fragmentShader).toContain('exp(-1.35')

    haze.dispose()
  })

  it('provides one frozen soft pass for reduced motion', () => {
    const soft = createGodRayMaterial({
      logoHeight: 200,
      profile: 'soft',
      staticTime: LOGO_GOD_RAY_REDUCED_TIME,
    })

    expect(soft.name).toBe('logo-god-rays-soft')
    expect(soft.uniforms.uTime.value).toBe(LOGO_GOD_RAY_REDUCED_TIME)
    expect(soft.vertexShader).toContain('aAcross * 0.9')
    expect(soft.fragmentShader).toContain('exp(-2.05')

    soft.dispose()
  })
})
