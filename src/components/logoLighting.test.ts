import { describe, expect, it } from 'vitest'
import {
  hasAxisCoverage,
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
} from './logoLighting'

describe('logo lighting', () => {
  it('lights the logo from all major axes for full rotation readability', () => {
    const positions = [
      ...LOGO_DIRECTIONAL_LIGHTS.map((light) => light.position),
      ...LOGO_POINT_LIGHTS.map((light) => light.position),
      ...LOGO_SPOT_LIGHTS.map((light) => light.position),
    ]

    expect(hasAxisCoverage(positions)).toBe(true)
  })

  it('keeps enough global fill to avoid dark orientations', () => {
    expect(LOGO_AMBIENT_LIGHT.intensity).toBeGreaterThanOrEqual(1.4)
    expect(LOGO_HEMISPHERE_LIGHT.intensity).toBeGreaterThanOrEqual(1.5)
    expect(LOGO_DIRECTIONAL_LIGHTS.length).toBeGreaterThanOrEqual(6)
    expect(LOGO_POINT_LIGHTS.length).toBeGreaterThanOrEqual(4)
    expect(LOGO_SPOT_LIGHTS.length).toBeGreaterThanOrEqual(3)
  })

  it('uses broad cone lights for manual logo fill tuning', () => {
    const wideCones = LOGO_SPOT_LIGHTS.filter((light) => light.angle >= 0.75)

    expect(wideCones.length).toBeGreaterThanOrEqual(2)
    expect(wideCones.every((light) => light.penumbra >= 0.9)).toBe(true)
    expect(LOGO_SPOT_LIGHTS.every((light) => light.position[2] > 0)).toBe(true)
  })

  it('aims cone lights at the centered logo pivot', () => {
    expect(LOGO_SPOT_LIGHTS.every((light) => light.target[0] === 0)).toBe(true)
    expect(LOGO_SPOT_LIGHTS.every((light) => light.target[1] === 0)).toBe(true)
    expect(LOGO_SPOT_LIGHTS.every((light) => Math.abs(light.target[2]) < 1)).toBe(true)
  })

  it('includes a strong direct white front light for the logo face', () => {
    const frontLight = LOGO_SPOT_LIGHTS.find((light) => light.key === 'direct-white-front')

    expect(frontLight).toBeDefined()
    expect(frontLight?.color).toBe('#ffffff')
    expect(frontLight?.intensity).toBeGreaterThanOrEqual(18_000)
    expect(frontLight?.position).toEqual([0, 0, 150])
    expect(frontLight?.target).toEqual([0, 0, 0])
  })
})
