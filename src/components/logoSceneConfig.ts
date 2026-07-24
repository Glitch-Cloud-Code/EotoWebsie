import type {
  DirectionalLogoLight,
  LogoLightingConfig,
  PointLogoLight,
  SpotLogoLight,
} from './logoLighting'

export const LOGO_AMBIENT_LIGHT = {
  intensity: 1.55,
} as const

export const LOGO_HEMISPHERE_LIGHT = {
  color: '#fff7e8',
  groundColor: '#3d1014',
  intensity: 1.9,
} as const

export const LOGO_DIRECTIONAL_LIGHTS: DirectionalLogoLight[] = [
  {
    color: '#fff8e9',
    intensity: 8.4,
    key: 'front-key',
    position: [42, 55, 96],
  },
  { color: '#fffdf5', intensity: 4.9, key: 'top-front', position: [0, 92, 70] },
  {
    color: '#ffdfbd',
    intensity: 5.2,
    key: 'back-rim',
    position: [-44, 48, -94],
  },
  {
    color: '#ffe7c7',
    intensity: 3.8,
    key: 'right-rim',
    position: [92, 12, -42],
  },
  {
    color: '#cf202a',
    intensity: 3.2,
    key: 'left-red-rim',
    position: [-92, -12, -38],
  },
  {
    color: '#b71d25',
    intensity: 2.4,
    key: 'low-red-fill',
    position: [0, -86, 54],
  },
]

export const LOGO_POINT_LIGHTS: PointLogoLight[] = [
  {
    color: '#fff2d4',
    intensity: 25000,
    key: 'front-glint',
    position: [0, 12, 86],
  },
  {
    color: '#ffd0a5',
    intensity: 25000,
    key: 'right-glint',
    position: [86, 18, 18],
  },
  {
    color: '#b71d25',
    intensity: 25000,
    key: 'left-red-glow',
    position: [-86, -16, 28],
  },
  {
    color: '#fff0d8',
    intensity: 25000,
    key: 'back-edge',
    position: [0, 22, -92],
  },
]

export const LOGO_SPOT_LIGHTS: SpotLogoLight[] = [
  {
    angle: 0.99,
    color: '#ffffff',
    intensity: 10000,
    key: 'direct-white-left',
    penumbra: 0,
    position: [-50, 0, 100],
    target: [0, 0, 0],
  },
  {
    angle: 0.99,
    color: '#ffffff',
    intensity: 5000,
    key: 'direct-white-right',
    penumbra: 0,
    position: [50, 0, 100],
    target: [0, 0, 0],
  },
  {
    angle: 0.99,
    color: '#ffffff',
    intensity: 5000,
    key: 'direct-white-front',
    penumbra: 0.1,
    position: [0, 0, 150],
    target: [0, 0, 0],
  },
  {
    angle: 0.99,
    color: '#fd000d',
    intensity: 100000,
    key: 'low-red-cone',
    penumbra: 0.95,
    position: [0, -20, 50],
    target: [0, 0, 0],
  },
  {
    angle: 0.99,
    color: '#00a2ff',
    intensity: 50000,
    key: 'wide-front-cone',
    penumbra: 0.95,
    position: [0, 18, 50],
    target: [0, 0, 0],
  },
  {
    angle: 0.99,
    color: '#1900ff',
    intensity: 50000,
    key: 'upper-left-cone',
    penumbra: 0.9,
    position: [-58, 70, 96],
    target: [0, 0, 0],
  },
]

export const LOGO_LIGHTING_CONFIG: LogoLightingConfig = {
  ambient: LOGO_AMBIENT_LIGHT,
  directional: LOGO_DIRECTIONAL_LIGHTS,
  hemisphere: LOGO_HEMISPHERE_LIGHT,
  point: LOGO_POINT_LIGHTS,
  spot: LOGO_SPOT_LIGHTS,
}
