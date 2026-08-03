import { describe, expect, it } from 'vitest'
import {
  validateLogoLighting,
  type LogoLightingConfig,
} from './logoLighting'
import {
  LOGO_AMBIENT_LIGHT,
  LOGO_DIRECTIONAL_LIGHTS,
  LOGO_ENVIRONMENT_LIGHTS,
  LOGO_HEMISPHERE_LIGHT,
  LOGO_LIGHTING_CONFIG,
  LOGO_POINT_LIGHTS,
  LOGO_SPOT_LIGHTS,
} from './logoSceneConfig'

describe('logo lighting', () => {
  it('uses a restrained direct-light rig', () => {
    expect(LOGO_AMBIENT_LIGHT.intensity).toBeLessThanOrEqual(0.2)
    expect(LOGO_HEMISPHERE_LIGHT.intensity).toBe(0)
    expect(LOGO_DIRECTIONAL_LIGHTS).toHaveLength(2)
    expect(LOGO_POINT_LIGHTS).toHaveLength(0)
    expect(LOGO_SPOT_LIGHTS).toHaveLength(1)
    expect(LOGO_DIRECTIONAL_LIGHTS[0].intensity).toBeGreaterThan(3)
  })

  it('uses neutral front and rear reflection panels', () => {
    expect(LOGO_ENVIRONMENT_LIGHTS).toHaveLength(2)
    expect(LOGO_ENVIRONMENT_LIGHTS.map((light) => light.key)).toEqual([
      'front-panel',
      'rear-panel',
    ])
    expect(
      LOGO_ENVIRONMENT_LIGHTS.every(
        (light) =>
          light.intensity <= 4.5 &&
          Number.parseInt(light.color.slice(1, 3), 16) -
            Number.parseInt(light.color.slice(5, 7), 16) <
            20,
      ),
    ).toBe(true)
  })

  it('uses a broad, soft red rim cone behind the logo', () => {
    const [rim] = LOGO_SPOT_LIGHTS

    expect(rim.key).toBe('red-rim')
    expect(rim.color).toBe('#b91522')
    expect(rim.angle).toBeGreaterThanOrEqual(0.7)
    expect(rim.penumbra).toBeGreaterThanOrEqual(0.8)
    expect(rim.position[2]).toBeLessThan(0)
    expect(rim.intensity).toBeLessThanOrEqual(250)
  })

  it('aims cone lights at the centered logo pivot', () => {
    expect(LOGO_SPOT_LIGHTS.every((light) => light.target[0] === 0)).toBe(true)
    expect(LOGO_SPOT_LIGHTS.every((light) => light.target[1] === 0)).toBe(true)
    expect(LOGO_SPOT_LIGHTS.every((light) => Math.abs(light.target[2]) < 1)).toBe(true)
  })

  it('includes a stable white directional key for the logo face', () => {
    const frontLight = LOGO_DIRECTIONAL_LIGHTS.find(
      (light) => light.key === 'front-key',
    )

    expect(frontLight).toBeDefined()
    expect(frontLight?.color).toBe('#ffffff')
    expect(frontLight?.intensity).toBeGreaterThanOrEqual(3)
    expect(frontLight?.position[2]).toBeGreaterThan(0)
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
