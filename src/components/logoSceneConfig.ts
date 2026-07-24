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
  groundColor: '#22090d',
  intensity: 0.35,
} as const

export const LOGO_DIRECTIONAL_LIGHTS: DirectionalLogoLight[] = [
  {
    color: '#fff7ec',
    intensity: 3.5,
    key: 'front-key',
    position: [0, 36, 110],
  },
  {
    color: '#dce6ef',
    intensity: 1.15,
    key: 'front-fill',
    position: [-70, -15, 65],
  },
  {
    color: '#f2f5f7',
    intensity: 2.1,
    key: 'white-rim',
    position: [-60, 55, -80],
  },
]

export const LOGO_POINT_LIGHTS: PointLogoLight[] = []

export const LOGO_SPOT_LIGHTS: SpotLogoLight[] = [
  {
    angle: 0.72,
    color: '#b91522',
    intensity: 1800,
    key: 'red-rim',
    penumbra: 0.85,
    position: [70, 22, -70],
    target: [0, 0, 0],
  },
]

export const LOGO_ENVIRONMENT_LIGHTS = [
  {
    color: '#fff8ee',
    intensity: 4,
    key: 'front-panel',
    position: [0, 12, 52] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    scale: [68, 28, 1] as [number, number, number],
  },
  {
    color: '#f2f6f8',
    intensity: 2.4,
    key: 'white-edge-panel',
    position: [-38, 28, -26] as [number, number, number],
    rotation: [0, Math.PI / 3, 0] as [number, number, number],
    scale: [24, 42, 1] as [number, number, number],
  },
  {
    color: '#a90f1c',
    intensity: 2,
    key: 'red-edge-panel',
    position: [42, 8, -30] as [number, number, number],
    rotation: [0, -Math.PI / 3, 0] as [number, number, number],
    scale: [22, 36, 1] as [number, number, number],
  },
] as const

export const LOGO_LIGHTING_CONFIG: LogoLightingConfig = {
  ambient: LOGO_AMBIENT_LIGHT,
  directional: LOGO_DIRECTIONAL_LIGHTS,
  hemisphere: LOGO_HEMISPHERE_LIGHT,
  point: LOGO_POINT_LIGHTS,
  spot: LOGO_SPOT_LIGHTS,
}
