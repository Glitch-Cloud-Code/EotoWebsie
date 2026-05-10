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

export const LOGO_RENDER_ORDER = {
  particles: 5,
  textOverlay: 6,
} as const

export const PARTICLE_RANDOM_SEED = 9103

export const WORDMARK_SHAPE_BOUNDS = {
  maxHeight: 310,
  maxWidth: 340,
  maxY: 1665,
  minHeight: 36,
  minWidth: 18,
  minY: 1320,
} as const

export const PARTICLE_KIND_SETTINGS = {
  flame: {
    alphaMultiplier: 0.9,
    count: 320,
    depthTest: false,
    driftY: [220, 400],
    driftZ: 70,
    fadeOutStart: 0.94,
    scale: [56, 110],
    startZ: [-70, -24],
  },
  smoke: {
    alphaMultiplier: 0.24,
    count: 220,
    depthTest: false,
    driftY: [176, 336],
    driftZ: 110,
    fadeOutStart: 0.94,
    scale: [96, 192],
    startZ: [-110, -36],
  },
} as const

export function isWordmarkShape(points: Point2D[]) {
  if (points.length === 0) {
    return false
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = maxX - minX
  const height = maxY - minY

  return (
    minY > WORDMARK_SHAPE_BOUNDS.minY &&
    maxY < WORDMARK_SHAPE_BOUNDS.maxY &&
    width > WORDMARK_SHAPE_BOUNDS.minWidth &&
    height > WORDMARK_SHAPE_BOUNDS.minHeight &&
    width < WORDMARK_SHAPE_BOUNDS.maxWidth &&
    height < WORDMARK_SHAPE_BOUNDS.maxHeight
  )
}

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
): Point2D[] {
  return shapes.flatMap((shape) => {
    const points = shape.getSpacedPoints(Math.max(28, Math.floor(shape.getLength() / 8)))
    if (points.length === 0) {
      return []
    }

    if (!isWordmarkShape(points)) {
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
) {
  const settings = PARTICLE_KIND_SETTINGS[kind]
  const positions = new Float32Array(settings.count * 3)
  const scales = new Float32Array(settings.count)
  const seeds = new Float32Array(settings.count)
  const drifts = new Float32Array(settings.count * 3)

  for (let index = 0; index < settings.count; index += 1) {
    const emitter = emitters[index % emitters.length]
    const baseIndex = index * 3

    positions[baseIndex] = emitter.x + (random() - 0.5) * (kind === 'flame' ? 10 : 18)
    positions[baseIndex + 1] = emitter.y + (random() - 0.5) * (kind === 'flame' ? 8 : 12)
    positions[baseIndex + 2] =
      kind === 'flame' ? -24 - random() * 46 : -36 - random() * 74

    scales[index] = settings.scale[0] + random() * (settings.scale[1] - settings.scale[0])
    seeds[index] = random()

    drifts[baseIndex] = (random() - 0.5) * (kind === 'flame' ? 22 : 38)
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
