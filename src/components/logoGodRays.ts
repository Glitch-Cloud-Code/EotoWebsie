import type { LogoQuality } from './logoQuality'
import { createSeededRandom, type RandomFn } from '../utils/random'

export const LOGO_GOD_RAY_PRIMARY_COUNT = 7
export const LOGO_GOD_RAY_SUBRAY_COUNT = 2
export const LOGO_GOD_RAY_COUNT =
  LOGO_GOD_RAY_PRIMARY_COUNT * LOGO_GOD_RAY_SUBRAY_COUNT
export const LOGO_GOD_RAY_SEGMENTS_HIGH = 28
export const LOGO_GOD_RAY_SEGMENTS_LOW = 14
export const LOGO_GOD_RAY_ALPHA = 0.3
export const LOGO_GOD_RAY_BEND = 5.4
export const LOGO_GOD_RAY_DEPTH_SWAY = 3.4
export const LOGO_GOD_RAY_EDGE_FADE_NDC = 0.12
export const LOGO_GOD_RAY_FIELD_DRIFT = 0.65
export const LOGO_GOD_RAY_FIELD_ROTATION = 0.008
export const LOGO_GOD_RAY_HAZE_ALPHA = 0.11
export const LOGO_GOD_RAY_LIFECYCLE_SECONDS = 9.5
export const LOGO_GOD_RAY_RENDER_ORDER = 1
export const LOGO_GOD_RAY_SCALE = 0.031
export const LOGO_GOD_RAY_SOURCE_Z_MIN = -54
export const LOGO_GOD_RAY_SOURCE_Z_MAX = -46
export const LOGO_GOD_RAY_TARGET_Z_MIN = -12
export const LOGO_GOD_RAY_TARGET_Z_MAX = -3
export const LOGO_GOD_RAY_WORDMARK_MIN_ALPHA = 0.34
export const LOGO_GOD_RAY_WORDMARK_HEIGHT_RATIO = 0.13
export const LOGO_GOD_RAY_WIDTH_PULSE = 1.5

export type GodRayGeometryData = {
  across: Float32Array
  alongs: Float32Array
  lifecycleSeeds: Float32Array
  positions: Float32Array
  seeds: Float32Array
}

type GodRayGeometryOptions = {
  quality?: LogoQuality
  random?: RandomFn
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = Math.min(
    1,
    Math.max(0, (value - edge0) / (edge1 - edge0)),
  )

  return normalized * normalized * (3 - 2 * normalized)
}

export function getGodRayScreenEdgeFade(ndcX: number, ndcY: number) {
  const edgeDistance = 1 - Math.max(Math.abs(ndcX), Math.abs(ndcY))

  return smoothstep(0, LOGO_GOD_RAY_EDGE_FADE_NDC, edgeDistance)
}

export function getGodRayWordmarkMask(y: number, logoHeight: number) {
  const halfHeight =
    logoHeight * LOGO_GOD_RAY_SCALE * LOGO_GOD_RAY_WORDMARK_HEIGHT_RATIO
  const outsideBand = smoothstep(halfHeight * 0.72, halfHeight, Math.abs(y))

  return (
    LOGO_GOD_RAY_WORDMARK_MIN_ALPHA +
    outsideBand * (1 - LOGO_GOD_RAY_WORDMARK_MIN_ALPHA)
  )
}

export function getGodRayLifecycle(timeSeconds: number, seed: number) {
  const rawCycle = timeSeconds / LOGO_GOD_RAY_LIFECYCLE_SECONDS + seed
  const cycle = ((rawCycle % 1) + 1) % 1
  const forming = smoothstep(0, 0.14, cycle)
  const collapsing = 1 - smoothstep(0.62, 0.92, cycle)

  return forming * collapsing
}

export function getGodRayGeometryBudget(quality: LogoQuality) {
  return quality === 'high'
    ? {
        primaryCount: LOGO_GOD_RAY_PRIMARY_COUNT,
        segments: LOGO_GOD_RAY_SEGMENTS_HIGH,
        subrayCount: LOGO_GOD_RAY_SUBRAY_COUNT,
      }
    : {
        primaryCount: 4,
        segments: LOGO_GOD_RAY_SEGMENTS_LOW,
        subrayCount: 1,
      }
}

export function getGodRayFieldTransform(timeSeconds: number) {
  return {
    rotationZ:
      (
        Math.sin(timeSeconds * 0.17) * 0.62 +
        Math.sin(timeSeconds * 0.071 + 0.8) * 0.38
      ) * LOGO_GOD_RAY_FIELD_ROTATION,
    x:
      (
        Math.sin(timeSeconds * 0.24) * 0.64 +
        Math.sin(timeSeconds * 0.093 + 1.7) * 0.36
      ) * LOGO_GOD_RAY_FIELD_DRIFT,
    y:
      (
        Math.cos(timeSeconds * 0.19 + 0.4) * 0.68 +
        Math.sin(timeSeconds * 0.077 - 0.7) * 0.32
      ) * LOGO_GOD_RAY_FIELD_DRIFT,
  }
}

export function createGodRayGeometryData(
  width: number,
  height: number,
  {
    quality = 'high',
    random = createSeededRandom(7727),
  }: GodRayGeometryOptions = {},
): GodRayGeometryData {
  const { primaryCount, segments, subrayCount } =
    getGodRayGeometryBudget(quality)
  const ribbonCount = primaryCount * subrayCount
  const vertexCount = ribbonCount * segments * 6
  const positions = new Float32Array(vertexCount * 3)
  const across = new Float32Array(vertexCount)
  const alongs = new Float32Array(vertexCount)
  const lifecycleSeeds = new Float32Array(vertexCount)
  const seeds = new Float32Array(vertexCount)
  const scaledWidth = width * LOGO_GOD_RAY_SCALE
  const scaledHeight = height * LOGO_GOD_RAY_SCALE
  const sourceBandWidth = scaledWidth * 0.92
  const targetBandWidth = scaledWidth * 1.72
  let targetVertex = 0

  const writeVertex = (
    x: number,
    y: number,
    z: number,
    along: number,
    acrossValue: number,
    seed: number,
    lifecycleSeed: number,
  ) => {
    const positionIndex = targetVertex * 3
    positions[positionIndex] = x
    positions[positionIndex + 1] = y
    positions[positionIndex + 2] = z
    across[targetVertex] = acrossValue
    alongs[targetVertex] = along
    seeds[targetVertex] = seed
    lifecycleSeeds[targetVertex] = lifecycleSeed
    targetVertex += 1
  }

  for (let primaryIndex = 0; primaryIndex < primaryCount; primaryIndex += 1) {
    const sourceProgress =
      primaryCount === 1 ? 0.5 : primaryIndex / (primaryCount - 1)
    const horizontalProgress = sourceProgress - 0.5
    const primarySourceX =
      horizontalProgress * sourceBandWidth +
      (random() - 0.5) * scaledWidth * 0.07
    const primaryTargetX =
      horizontalProgress * targetBandWidth +
      (random() - 0.5) * scaledWidth * 0.11
    const primarySourceY = scaledHeight * (0.88 + random() * 0.15)
    const primaryTargetY = -scaledHeight * (0.78 + random() * 0.22)
    const primarySourceZ =
      LOGO_GOD_RAY_SOURCE_Z_MIN +
      random() *
        (LOGO_GOD_RAY_SOURCE_Z_MAX - LOGO_GOD_RAY_SOURCE_Z_MIN)
    const primaryTargetZ =
      LOGO_GOD_RAY_TARGET_Z_MIN +
      random() *
        (LOGO_GOD_RAY_TARGET_Z_MAX - LOGO_GOD_RAY_TARGET_Z_MIN)
    const primarySeed = random()
    const lifecycleSeed =
      (primaryIndex / primaryCount + random() * 0.035) % 1

    for (let subrayIndex = 0; subrayIndex < subrayCount; subrayIndex += 1) {
      const pairedOffset =
        subrayCount === 1
          ? 0
          : subrayIndex / (subrayCount - 1) - 0.5
      const sourceX =
        primarySourceX + pairedOffset * scaledWidth * 0.018
      const targetX =
        primaryTargetX + pairedOffset * scaledWidth * 0.032
      const sourceY =
        primarySourceY + pairedOffset * scaledHeight * 0.012
      const targetY =
        primaryTargetY + pairedOffset * scaledHeight * 0.022
      const sourceZ = primarySourceZ - pairedOffset * 1.6
      const targetZ = primaryTargetZ + pairedOffset * 2.4
      const directionX = targetX - sourceX
      const directionY = targetY - sourceY
      const directionLength = Math.hypot(directionX, directionY)
      const normalX = -directionY / directionLength
      const normalY = directionX / directionLength
      const baseHalfWidth = scaledWidth * (0.047 + random() * 0.02)
      const seed =
        (primarySeed + subrayIndex * 0.173 + random() * 0.07) % 1

      const getEdge = (along: number, acrossValue: number) => {
        const halfWidth = baseHalfWidth * (0.3 + along * 1.75)
        const centerX = sourceX + directionX * along
        const centerY = sourceY + directionY * along
        const centerZ = sourceZ + (targetZ - sourceZ) * along

        return {
          x: centerX + normalX * halfWidth * acrossValue,
          y: centerY + normalY * halfWidth * acrossValue,
          z: centerZ,
        }
      }

      for (let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
        const nearAlong = segmentIndex / segments
        const farAlong = (segmentIndex + 1) / segments
        const nearLeft = getEdge(nearAlong, -1)
        const nearRight = getEdge(nearAlong, 1)
        const farLeft = getEdge(farAlong, -1)
        const farRight = getEdge(farAlong, 1)

        writeVertex(
          nearLeft.x,
          nearLeft.y,
          nearLeft.z,
          nearAlong,
          -1,
          seed,
          lifecycleSeed,
        )
        writeVertex(
          nearRight.x,
          nearRight.y,
          nearRight.z,
          nearAlong,
          1,
          seed,
          lifecycleSeed,
        )
        writeVertex(
          farLeft.x,
          farLeft.y,
          farLeft.z,
          farAlong,
          -1,
          seed,
          lifecycleSeed,
        )
        writeVertex(
          nearRight.x,
          nearRight.y,
          nearRight.z,
          nearAlong,
          1,
          seed,
          lifecycleSeed,
        )
        writeVertex(
          farRight.x,
          farRight.y,
          farRight.z,
          farAlong,
          1,
          seed,
          lifecycleSeed,
        )
        writeVertex(
          farLeft.x,
          farLeft.y,
          farLeft.z,
          farAlong,
          -1,
          seed,
          lifecycleSeed,
        )
      }
    }
  }

  return {
    across,
    alongs,
    lifecycleSeeds,
    positions,
    seeds,
  }
}
