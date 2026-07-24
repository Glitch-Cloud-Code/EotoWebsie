import { describe, expect, it } from 'vitest'
import {
  hasAxisCoverage,
  validateLogoLighting,
  type LogoLightingConfig,
} from './logoLighting'
import {
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_LIGHTING_CONFIG,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
} from './logoSceneConfig'

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
    const wideCones = LOGO_SPOT_LIGHTS.filter((light) => light.angle >= 0.75 && !light.key.startsWith('direct-white'))

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
    expect(frontLight?.intensity).toBeGreaterThanOrEqual(5_000)
    expect(frontLight?.position).toEqual([0, 0, 150])
    expect(frontLight?.target).toEqual([0, 0, 0])
  })

  it('keeps light keys unique for stable React rendering', () => {
    const keys = [...LOGO_DIRECTIONAL_LIGHTS, ...LOGO_POINT_LIGHTS, ...LOGO_SPOT_LIGHTS].map((light) => light.key)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('passes lighting schema and energy validation', () => {
    expect(validateLogoLighting(LOGO_LIGHTING_CONFIG)).toEqual([])
  })

  it('rejects duplicate keys, unsafe energy, and invalid spot targets', () => {
    const invalidConfig: LogoLightingConfig = {
      ambient: { intensity: 1 },
      directional: [
        {
          color: '#ffffff',
          intensity: 21,
          key: 'duplicate',
          position: [0, 0, 1],
        },
      ],
      hemisphere: {
        color: '#ffffff',
        groundColor: '#000000',
        intensity: 1,
      },
      point: [
        {
          color: '#ffffff',
          intensity: 1,
          key: 'duplicate',
          position: [Number.NaN, 0, 1],
        },
      ],
      spot: [
        {
          angle: 0,
          color: '#ffffff',
          intensity: 1,
          key: 'bad-spot',
          penumbra: 2,
          position: [0, 0, 1],
          target: [0, 0, 1],
        },
      ],
    }

    const errors = validateLogoLighting(invalidConfig)

    expect(errors).toContain('duplicate light key: duplicate')
    expect(errors).toContain('duplicate intensity exceeds directional limits')
    expect(errors).toContain('duplicate position must contain finite values')
    expect(errors).toContain('bad-spot target must differ from position')
    expect(errors).toContain('bad-spot angle must be within (0, PI / 2]')
    expect(errors).toContain('bad-spot penumbra must be within [0, 1]')
  })
})
