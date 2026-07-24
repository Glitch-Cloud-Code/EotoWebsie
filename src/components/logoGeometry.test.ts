import { describe, expect, it } from 'vitest'
import { type Shape } from 'three'
import {
  buildLogoLayout,
  LOGO_HITBOX_DEPTH,
  LOGO_HITBOX_PADDING,
  LOGO_SURFACE_SAMPLE_LIMIT,
} from './logoGeometry'
import type { Point2D } from './logoParticles'

function shape(points: Point2D[]): Shape {
  return {
    getLength: () => 100,
    getSpacedPoints: () => points,
  } as unknown as Shape
}

describe('logo geometry layout', () => {
  it('builds padded hitbox dimensions from full logo bounds', () => {
    const layout = buildLogoLayout([
      shape([
        { x: -100, y: -40 },
        { x: 140, y: -40 },
        { x: 140, y: 80 },
        { x: -100, y: 80 },
      ]),
    ])

    expect(layout.width).toBe(240 + LOGO_HITBOX_PADDING)
    expect(layout.height).toBe(120 + LOGO_HITBOX_PADDING)
    expect(layout.surfacePoints.length).toBeGreaterThan(0)
    expect(LOGO_HITBOX_DEPTH).toBeGreaterThan(30)
  })

  it('caps generated surface metadata while preserving full bounds', () => {
    const points = Array.from({ length: 1_000 }, (_, index) => ({
      x: index,
      y: index % 80,
    }))
    const layout = buildLogoLayout([shape(points)])

    expect(layout.surfacePoints).toHaveLength(LOGO_SURFACE_SAMPLE_LIMIT)
    expect(layout.width).toBe(999 + LOGO_HITBOX_PADDING)
  })
})
