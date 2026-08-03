import { createSeededRandom, type RandomFn } from '../utils/random'

export type ParticleKind = 'flame' | 'smoke'

export type Point2D = {
  x: number
  y: number
}

export type ShapeSampler = {
  getLength: () => number
  getSpacedPoints: (divisions: number) => Point2D[]
}

export const PARTICLE_DEPTH_CLAMP_Z = -18
export const PARTICLE_FLAME_CENTER_EXCLUSION_HALF_WIDTH = 110
export const PARTICLE_FLAME_SOURCE_Y_OFFSET = 16

export const LOGO_RENDER_ORDER = {
  particles: 5,
  textOverlay: 6,
} as const

export const PARTICLE_RANDOM_SEED = 9103

export const LOGO_WORDMARK_SHAPE_INDICES = Array.from(
  { length: 24 },
  (_, index) => index,
)

export const PARTICLE_KIND_SETTINGS = {
  flame: {
    alphaMultiplier: 0.34,
    count: 180,
    depthTest: true,
    driftX: 18,
    driftY: [160, 280],
    driftZ: 70,
    fadeOutStart: 0.94,
    scale: [44, 82],
    startZ: [-70, -24],
  },
  smoke: {
    alphaMultiplier: 0.1,
    count: 120,
    depthTest: true,
    driftX: 30,
    driftY: [176, 336],
    driftZ: 110,
    fadeOutStart: 0.94,
    scale: [96, 192],
    startZ: [-110, -36],
  },
} as const

export function spreadEmittersAcrossBand(
  points: Point2D[],
  bucketCount: number,
  pickMode: 'bottom' | 'center',
): Point2D[] {
  if (points.length === 0) {
    return points
  }

  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const bucketWidth = Math.max((maxX - minX) / bucketCount, 1)

  return Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const bucketStart = minX + bucketWidth * bucketIndex
    const bucketEnd = bucketStart + bucketWidth
    const bucketPoints = points.filter(
      (point) => point.x >= bucketStart && (bucketIndex === bucketCount - 1 ? point.x <= bucketEnd : point.x < bucketEnd),
    )

    if (bucketPoints.length === 0) {
      return {
        x: bucketStart + bucketWidth * 0.5,
        y: 0,
      }
    }

    if (pickMode === 'bottom') {
      return bucketPoints.reduce((best, point) => (point.y > best.y ? point : best))
    }

    return bucketPoints.reduce((best, point) => (Math.abs(point.y) < Math.abs(best.y) ? point : best))
  })
}

export function sampleBottomEmittersFromTextShapes(
  shapes: ShapeSampler[],
  centerX: number,
  centerY: number,
  wordmarkShapeIndices: readonly number[] = LOGO_WORDMARK_SHAPE_INDICES,
): Point2D[] {
  const wordmarkShapes = new Set(wordmarkShapeIndices)

  return shapes.flatMap((shape, shapeIndex) => {
    if (!wordmarkShapes.has(shapeIndex)) {
      return []
    }

    const points = shape.getSpacedPoints(Math.max(28, Math.floor(shape.getLength() / 8)))
    if (points.length === 0) {
      return []
    }

    const maxY = Math.max(...points.map((point) => point.y))
    const minY = Math.min(...points.map((point) => point.y))
    const height = maxY - minY
    const bottomCutoff = maxY - Math.max(10, Math.min(28, height * 0.18))

    return points
      .filter((point) => point.y >= bottomCutoff)
      .map((point) => ({
        x: point.x - centerX,
        y: point.y - centerY,
      }))
  })
}

export function createParticleAttributes(
  emitters: Point2D[],
  kind: ParticleKind,
  random: RandomFn = createSeededRandom(PARTICLE_RANDOM_SEED),
  count: number = PARTICLE_KIND_SETTINGS[kind].count,
) {
  if (emitters.length === 0) {
    return {
      drifts: new Float32Array(),
      positions: new Float32Array(),
      scales: new Float32Array(),
      seeds: new Float32Array(),
    }
  }

  const settings = PARTICLE_KIND_SETTINGS[kind]
  const eligibleEmitters =
    kind === 'flame'
      ? emitters.filter(
          ({ x }) =>
            Math.abs(x) > PARTICLE_FLAME_CENTER_EXCLUSION_HALF_WIDTH,
        )
      : emitters
  const activeEmitters =
    eligibleEmitters.length > 0 ? eligibleEmitters : emitters
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const seeds = new Float32Array(count)
  const drifts = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const emitter = activeEmitters[index % activeEmitters.length]
    const baseIndex = index * 3

    positions[baseIndex] = emitter.x + (random() - 0.5) * (kind === 'flame' ? 10 : 18)
    positions[baseIndex + 1] =
      emitter.y +
      (kind === 'flame' ? PARTICLE_FLAME_SOURCE_Y_OFFSET : 0) +
      (random() - 0.5) * (kind === 'flame' ? 8 : 12)
    positions[baseIndex + 2] =
      settings.startZ[0] +
      random() * (settings.startZ[1] - settings.startZ[0])

    scales[index] = settings.scale[0] + random() * (settings.scale[1] - settings.scale[0])
    seeds[index] = random()

    drifts[baseIndex] = (random() - 0.5) * settings.driftX
    drifts[baseIndex + 1] = settings.driftY[0] + random() * (settings.driftY[1] - settings.driftY[0])
    drifts[baseIndex + 2] = (random() - 0.5) * settings.driftZ
  }

  return {
    drifts,
    positions,
    scales,
    seeds,
  }
}
