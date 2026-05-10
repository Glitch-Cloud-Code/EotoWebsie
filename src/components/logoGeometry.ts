import { ExtrudeGeometry, type Shape } from 'three'
import {
  isWordmarkShape,
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
  width: number
}

export type LogoGeometryEntry = {
  geometry: ExtrudeGeometry
  isWordmark: boolean
}

export const LOGO_HITBOX_DEPTH = 120
export const LOGO_HITBOX_PADDING = 80

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
    width: bounds.maxX - bounds.minX + LOGO_HITBOX_PADDING,
  }
}

export function createLogoGeometries(shapes: Shape[], logoLayout: LogoLayout): LogoGeometryEntry[] {
  return shapes.map((shape) => {
    const points = shape.getSpacedPoints(Math.max(28, Math.floor(shape.getLength() / 8)))
    const geometry = new ExtrudeGeometry(shape, {
      depth: 30,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 2.4,
      bevelThickness: 2.4,
      curveSegments: 24,
      steps: 1,
    })

    geometry.translate(-logoLayout.centerX, -logoLayout.centerY, -15)
    return {
      geometry,
      isWordmark: isWordmarkShape(points),
    }
  })
}
