import type {
  DirectionalLogoLight,
  LogoLightingConfig,
  PointLogoLight,
  SpotLogoLight,
} from './logoLighting'

export const LOGO_AMBIENT_LIGHT = {
  intensity: 0.18,
} as const

export const LOGO_HEMISPHERE_LIGHT = {
  color: '#e9eef2',
  groundColor: '#08090a',
  intensity: 0,
} as const

export const LOGO_DIRECTIONAL_LIGHTS: DirectionalLogoLight[] = [
  {
    color: '#ffffff',
    intensity: 3.6,
    key: 'front-key',
    position: [0, 28, 110],
  },
  {
    color: '#e8eef2',
    intensity: 2.1,
    key: 'neutral-fill',
    position: [-58, -8, -82],
  },
]

export const LOGO_POINT_LIGHTS: PointLogoLight[] = []

export const LOGO_SPOT_LIGHTS: SpotLogoLight[] = [
  {
    angle: 0.72,
    color: '#b91522',
    intensity: 240,
    key: 'red-rim',
    penumbra: 0.85,
    position: [70, 22, -70],
    target: [0, 0, 0],
  },
]

export const LOGO_ENVIRONMENT_LIGHTS = [
  {
    color: '#ffffff',
    intensity: 4.2,
    key: 'front-panel',
    position: [0, 12, 52] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    scale: [68, 28, 1] as [number, number, number],
  },
  {
    color: '#f2f6f8',
    intensity: 3.2,
    key: 'rear-panel',
    position: [-24, 18, -48] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [44, 38, 1] as [number, number, number],
  },
] as const

export const LOGO_LIGHTING_CONFIG: LogoLightingConfig = {
  ambient: LOGO_AMBIENT_LIGHT,
  directional: LOGO_DIRECTIONAL_LIGHTS,
  hemisphere: LOGO_HEMISPHERE_LIGHT,
  point: LOGO_POINT_LIGHTS,
  spot: LOGO_SPOT_LIGHTS,
}
