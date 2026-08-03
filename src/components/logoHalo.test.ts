import { describe, expect, it } from 'vitest'
import {
  createLogoHaloMaterial,
  LOGO_HALO_ALPHA,
  LOGO_HALO_RENDER_ORDER,
  LOGO_HALO_Z,
} from './logoHaloMaterial'

describe('logo halo', () => {
  it('stays subtle and behind the logo', () => {
    expect(LOGO_HALO_ALPHA).toBeGreaterThanOrEqual(0.1)
    expect(LOGO_HALO_ALPHA).toBeLessThanOrEqual(0.16)
    expect(LOGO_HALO_Z).toBeLessThan(0)
    expect(LOGO_HALO_RENDER_ORDER).toBe(0)
  })

  it('uses a transparent additive material without writing depth', () => {
    const material = createLogoHaloMaterial()

    expect(material.transparent).toBe(true)
    expect(material.depthTest).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.fragmentShader).toContain('redGlow')
    expect(material.fragmentShader).toContain('falloff')

    material.dispose()
  })
})
