export type LightPosition = [number, number, number]

export type DirectionalLogoLight = {
  color: string
  intensity: number
  key: string
  position: LightPosition
}

export type PointLogoLight = DirectionalLogoLight

export type SpotLogoLight = DirectionalLogoLight & {
  angle: number
  penumbra: number
  target: LightPosition
}

export type LogoLightingConfig = {
  ambient: { intensity: number }
  directional: DirectionalLogoLight[]
  hemisphere: {
    color: string
    groundColor: string
    intensity: number
  }
  point: PointLogoLight[]
  spot: SpotLogoLight[]
}

const MAX_INTENSITY = {
  directional: 20,
  point: 50_000,
  spot: 120_000,
} as const

function isFinitePosition(position: LightPosition) {
  return position.every(Number.isFinite)
}

export function validateLogoLighting(config: LogoLightingConfig) {
  const errors: string[] = []
  const lights = [
    ...config.directional.map((light) => ({ ...light, kind: 'directional' as const })),
    ...config.point.map((light) => ({ ...light, kind: 'point' as const })),
    ...config.spot.map((light) => ({ ...light, kind: 'spot' as const })),
  ]
  const keys = new Set<string>()

  if (!Number.isFinite(config.ambient.intensity) || config.ambient.intensity < 0) {
    errors.push('ambient intensity must be finite and non-negative')
  }
  if (!Number.isFinite(config.hemisphere.intensity) || config.hemisphere.intensity < 0) {
    errors.push('hemisphere intensity must be finite and non-negative')
  }

  for (const light of lights) {
    if (!light.key.trim()) {
      errors.push('light key must not be empty')
    } else if (keys.has(light.key)) {
      errors.push(`duplicate light key: ${light.key}`)
    }
    keys.add(light.key)

    if (!isFinitePosition(light.position)) {
      errors.push(`${light.key} position must contain finite values`)
    }
    if (
      !Number.isFinite(light.intensity) ||
      light.intensity <= 0 ||
      light.intensity > MAX_INTENSITY[light.kind]
    ) {
      errors.push(`${light.key} intensity exceeds ${light.kind} limits`)
    }

    if (light.kind === 'spot') {
      if (!isFinitePosition(light.target)) {
        errors.push(`${light.key} target must contain finite values`)
      }
      if (
        light.position.every((value, index) => value === light.target[index])
      ) {
        errors.push(`${light.key} target must differ from position`)
      }
      if (!Number.isFinite(light.angle) || light.angle <= 0 || light.angle > Math.PI / 2) {
        errors.push(`${light.key} angle must be within (0, PI / 2]`)
      }
      if (!Number.isFinite(light.penumbra) || light.penumbra < 0 || light.penumbra > 1) {
        errors.push(`${light.key} penumbra must be within [0, 1]`)
      }
    }
  }

  return errors
}
