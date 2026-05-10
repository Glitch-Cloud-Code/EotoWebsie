import { describe, expect, it } from 'vitest'
import { type Shape } from 'three'
import { buildLogoLayout, LOGO_HITBOX_DEPTH, LOGO_HITBOX_PADDING } from './logoGeometry'
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
    expect(LOGO_HITBOX_DEPTH).toBeGreaterThan(30)
  })
})
