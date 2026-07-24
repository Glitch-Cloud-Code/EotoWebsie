import type { Shape } from 'three'
import {
  sampleBottomEmittersFromTextShapes,
  spreadEmittersAcrossBand,
  type Point2D,
} from './logoParticles'

export type LogoLayout = {
  centerX: number
  centerY: number
  flameEmitters: Point2D[]
  height: number
  smokeEmitters: Point2D[]
  surfacePoints: Point2D[]
  width: number
}

export const LOGO_HITBOX_DEPTH = 120
export const LOGO_HITBOX_PADDING = 80
export const LOGO_SURFACE_SAMPLE_LIMIT = 720

function sampleSurfacePoints(points: Point2D[]) {
  if (points.length <= LOGO_SURFACE_SAMPLE_LIMIT) {
    return points
  }

  const step = points.length / LOGO_SURFACE_SAMPLE_LIMIT
  return Array.from(
    { length: LOGO_SURFACE_SAMPLE_LIMIT },
    (_, index) => points[Math.floor(index * step)],
  )
}

export function buildLogoLayout(shapes: Shape[]): LogoLayout {
  const sampledPoints = shapes.flatMap((shape) =>
    shape.getSpacedPoints(Math.max(18, Math.floor(shape.getLength() / 10))),
  )

  const bounds = sampledPoints.reduce(
    (accumulator, point) => ({
      maxX: Math.max(accumulator.maxX, point.x),
      maxY: Math.max(accumulator.maxY, point.y),
      minX: Math.min(accumulator.minX, point.x),
      minY: Math.min(accumulator.minY, point.y),
    }),
    {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    },
  )

  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const spanY = bounds.maxY - bounds.minY
  const centeredEmitters = sampledPoints.map((point) => ({
    x: point.x - centerX,
    y: point.y - centerY,
  }))
  const textBottomEmitters = sampleBottomEmittersFromTextShapes(shapes, centerX, centerY)
  const smokeBandPoints = centeredEmitters.filter((point) => Math.abs(point.y) < spanY * 0.18)

  return {
    centerX,
    centerY,
    flameEmitters:
      textBottomEmitters.length > 0
        ? spreadEmittersAcrossBand(textBottomEmitters, 46, 'bottom')
        : spreadEmittersAcrossBand(centeredEmitters, 38, 'bottom'),
    height: bounds.maxY - bounds.minY + LOGO_HITBOX_PADDING,
    smokeEmitters:
      smokeBandPoints.length > 0
        ? spreadEmittersAcrossBand(smokeBandPoints, 22, 'center')
        : spreadEmittersAcrossBand(centeredEmitters, 22, 'center'),
    surfacePoints: sampleSurfacePoints(centeredEmitters),
    width: bounds.maxX - bounds.minX + LOGO_HITBOX_PADDING,
  }
}
