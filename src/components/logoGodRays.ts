import { createSeededRandom, type RandomFn } from '../utils/random'

export const LOGO_GOD_RAY_COUNT = 8
export const LOGO_GOD_RAY_ALPHA = 0.06
export const LOGO_GOD_RAY_NEAR_FADE = 0.52
export const LOGO_GOD_RAY_RENDER_ORDER = 1
export const LOGO_GOD_RAY_SWAY = 0.022
export const LOGO_GOD_RAY_Z = -30
export const LOGO_GOD_RAY_SCALE = 0.031

export type GodRayGeometryData = {
  fades: Float32Array
  positions: Float32Array
  seeds: Float32Array
}

export function createGodRayGeometryData(
  width: number,
  height: number,
  random: RandomFn = createSeededRandom(7727),
): GodRayGeometryData {
  const positions = new Float32Array(LOGO_GOD_RAY_COUNT * 6 * 3)
  const fades = new Float32Array(LOGO_GOD_RAY_COUNT * 6)
  const seeds = new Float32Array(LOGO_GOD_RAY_COUNT * 6)
  const scaledWidth = width * LOGO_GOD_RAY_SCALE
  const scaledHeight = height * LOGO_GOD_RAY_SCALE
  const radius = Math.max(scaledWidth, scaledHeight) * 0.82
  const nearRadius = Math.max(scaledWidth, scaledHeight) * 0.06

  for (let rayIndex = 0; rayIndex < LOGO_GOD_RAY_COUNT; rayIndex += 1) {
    const angle = (rayIndex / LOGO_GOD_RAY_COUNT) * Math.PI * 2 + (random() - 0.5) * 0.16
    const spread = 0.028 + random() * 0.058
    const length = radius * (0.64 + random() * 0.42)
    const seed = random()
    const center = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    }
    const tangent = {
      x: -Math.sin(angle),
      y: Math.cos(angle),
    }
    const nearCenter = {
      x: center.x * nearRadius,
      y: center.y * nearRadius,
    }
    const farCenter = {
      x: center.x * length,
      y: center.y * length,
    }
    const nearHalfWidth = Math.max(scaledWidth, scaledHeight) * spread * 0.2
    const farHalfWidth = Math.max(scaledWidth, scaledHeight) * spread
    const vertices = [
      [nearCenter.x - tangent.x * nearHalfWidth, nearCenter.y - tangent.y * nearHalfWidth, LOGO_GOD_RAY_Z, LOGO_GOD_RAY_NEAR_FADE],
      [nearCenter.x + tangent.x * nearHalfWidth, nearCenter.y + tangent.y * nearHalfWidth, LOGO_GOD_RAY_Z, LOGO_GOD_RAY_NEAR_FADE],
      [farCenter.x - tangent.x * farHalfWidth, farCenter.y - tangent.y * farHalfWidth, LOGO_GOD_RAY_Z, 0],
      [nearCenter.x + tangent.x * nearHalfWidth, nearCenter.y + tangent.y * nearHalfWidth, LOGO_GOD_RAY_Z, LOGO_GOD_RAY_NEAR_FADE],
      [farCenter.x + tangent.x * farHalfWidth, farCenter.y + tangent.y * farHalfWidth, LOGO_GOD_RAY_Z, 0],
      [farCenter.x - tangent.x * farHalfWidth, farCenter.y - tangent.y * farHalfWidth, LOGO_GOD_RAY_Z, 0],
    ]

    for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex += 1) {
      const targetIndex = rayIndex * 6 + vertexIndex
      const positionIndex = targetIndex * 3
      const [x, y, z, fade] = vertices[vertexIndex]

      positions[positionIndex] = x
      positions[positionIndex + 1] = y
      positions[positionIndex + 2] = z
      fades[targetIndex] = fade
      seeds[targetIndex] = seed
    }
  }

  return {
    fades,
    positions,
    seeds,
  }
}
