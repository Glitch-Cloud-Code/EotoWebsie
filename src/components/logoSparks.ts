import { createSeededRandom, type RandomFn } from '../utils/random'
import type { Point2D } from './logoParticles'

export type Point3D = {
  x: number
  y: number
  z: number
}

export const LOGO_MODEL_SCALE = 0.031
export const LOGO_MODEL_TRANSFORM_SCALE: [number, number, number] = [
  LOGO_MODEL_SCALE,
  LOGO_MODEL_SCALE,
  LOGO_MODEL_SCALE,
]
export const LOGO_EFFECTS_TRANSFORM_SCALE: [number, number, number] = [
  LOGO_MODEL_SCALE,
  -LOGO_MODEL_SCALE,
  LOGO_MODEL_SCALE,
]
export const LOGO_SPARK_BURST_COUNT = 54
export const LOGO_SPARK_LIFETIME_SECONDS = 0.72
export const LOGO_SPARK_Z = 22

export function toLogoLocalClickPoint(point: Point3D): Point2D {
  return {
    x: point.x / LOGO_MODEL_SCALE,
    y: point.y / -LOGO_MODEL_SCALE,
  }
}

export function toLogoScenePoint(point: Point2D, z = LOGO_SPARK_Z): Point3D {
  return {
    x: point.x * LOGO_MODEL_SCALE,
    y: point.y * -LOGO_MODEL_SCALE,
    z: z * LOGO_MODEL_SCALE,
  }
}

export function findNearestLogoSurfacePoint(points: Point2D[], clickPoint: Point2D): Point2D {
  if (points.length === 0) {
    return clickPoint
  }

  return points.reduce((nearest, point) => {
    const nearestDistance = (nearest.x - clickPoint.x) ** 2 + (nearest.y - clickPoint.y) ** 2
    const pointDistance = (point.x - clickPoint.x) ** 2 + (point.y - clickPoint.y) ** 2

    return pointDistance < nearestDistance ? point : nearest
  })
}

export function createSparkAttributes(random: RandomFn = createSeededRandom(4109)) {
  const positions = new Float32Array(LOGO_SPARK_BURST_COUNT * 3)
  const scales = new Float32Array(LOGO_SPARK_BURST_COUNT)
  const seeds = new Float32Array(LOGO_SPARK_BURST_COUNT)
  const velocities = new Float32Array(LOGO_SPARK_BURST_COUNT * 3)

  for (let index = 0; index < LOGO_SPARK_BURST_COUNT; index += 1) {
    const baseIndex = index * 3
    const angle = random() * Math.PI * 2
    const radius = 110 + random() * 260
    const zKick = 70 + random() * 180

    velocities[baseIndex] = Math.cos(angle) * radius
    velocities[baseIndex + 1] = Math.sin(angle) * radius
    velocities[baseIndex + 2] = zKick
    scales[index] = 10 + random() * 24
    seeds[index] = random()
  }

  return {
    positions,
    scales,
    seeds,
    velocities,
  }
}
