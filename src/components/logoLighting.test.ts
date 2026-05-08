import { describe, expect, it } from 'vitest'
import {
  hasAxisCoverage,
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_POINT_LIGHTS,
} from './logoLighting'

describe('logo lighting', () => {
  it('lights the logo from all major axes for full rotation readability', () => {
    const positions = [
      ...LOGO_DIRECTIONAL_LIGHTS.map((light) => light.position),
      ...LOGO_POINT_LIGHTS.map((light) => light.position),
    ]

    expect(hasAxisCoverage(positions)).toBe(true)
  })

  it('keeps enough global fill to avoid dark orientations', () => {
    expect(LOGO_AMBIENT_LIGHT.intensity).toBeGreaterThanOrEqual(1.4)
    expect(LOGO_HEMISPHERE_LIGHT.intensity).toBeGreaterThanOrEqual(1.5)
    expect(LOGO_DIRECTIONAL_LIGHTS.length).toBeGreaterThanOrEqual(6)
    expect(LOGO_POINT_LIGHTS.length).toBeGreaterThanOrEqual(4)
  })
})
