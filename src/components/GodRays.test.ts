import { AdditiveBlending, DoubleSide } from 'three'
import { describe, expect, it } from 'vitest'
import { createGodRayMaterial } from './logoGodRayMaterial'
import { LOGO_GOD_RAY_ALPHA } from './logoGodRays'

describe('GodRays material', () => {
  it('stays visible from both sides and outside scene lighting', () => {
    const material = createGodRayMaterial()

    expect(material.blending).toBe(AdditiveBlending)
    expect(material.depthTest).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.side).toBe(DoubleSide)
    expect(material.toneMapped).toBe(false)
    expect(material.transparent).toBe(true)
    expect(material.fragmentShader).toContain(LOGO_GOD_RAY_ALPHA.toFixed(2))
    expect(material.vertexShader).toContain('uniform float uTime')
    expect(material.vertexShader).toContain('raySway')
    expect(material.vertexShader).toContain('rayBreathing')

    material.dispose()
  })
})
