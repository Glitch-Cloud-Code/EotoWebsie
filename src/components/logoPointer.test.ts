import { describe, expect, it } from 'vitest'
import { getLogoTiltFromPointer, normalizeViewportPointer } from './logoPointer'

describe('logo pointer tracking', () => {
  it('normalizes pointer coordinates against the viewport, not the canvas', () => {
    expect(normalizeViewportPointer(0, 0, 1000, 500)).toEqual({ x: -1, y: 1 })
    expect(normalizeViewportPointer(1000, 500, 1000, 500)).toEqual({ x: 1, y: -1 })
    expect(normalizeViewportPointer(500, 250, 1000, 500)).toEqual({ x: 0, y: 0 })
  })

  it('maps viewport pointer to controlled logo tilt', () => {
    expect(getLogoTiltFromPointer({ x: -1, y: 1 })).toEqual({ x: -0.15, y: 0.28 })
    expect(getLogoTiltFromPointer({ x: 1, y: -1 })).toEqual({ x: 0.15, y: -0.28 })
    expect(getLogoTiltFromPointer({ x: 8, y: -8 })).toEqual({ x: 0.15, y: -0.28 })
  })
})
