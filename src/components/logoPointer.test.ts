import { describe, expect, it } from 'vitest'
import { LOGO_MOTION } from './logoMotion'
import {
  getFlickSpinAxis,
  getLogoTiltFromPointer,
  normalizeLogoClickPoint,
  normalizeViewportPointer,
} from './logoPointer'

describe('logo pointer tracking', () => {
  it('normalizes pointer coordinates against the viewport, not the canvas', () => {
    expect(normalizeViewportPointer(0, 0, 1000, 500)).toEqual({ x: -1, y: 1 })
    expect(normalizeViewportPointer(1000, 500, 1000, 500)).toEqual({ x: 1, y: -1 })
    expect(normalizeViewportPointer(500, 250, 1000, 500)).toEqual({ x: 0, y: 0 })
  })

  it('maps viewport pointer to controlled logo tilt', () => {
    expect(getLogoTiltFromPointer({ x: -1, y: 1 })).toEqual({
      x: -LOGO_MOTION.maxTiltX,
      y: LOGO_MOTION.maxTiltY,
    })
    expect(getLogoTiltFromPointer({ x: 1, y: -1 })).toEqual({
      x: LOGO_MOTION.maxTiltX,
      y: -LOGO_MOTION.maxTiltY,
    })
    expect(getLogoTiltFromPointer({ x: 8, y: -8 })).toEqual({
      x: LOGO_MOTION.maxTiltX,
      y: -LOGO_MOTION.maxTiltY,
    })
  })

  it('normalizes flick points against rectangular logo bounds', () => {
    expect(normalizeLogoClickPoint({ x: 20, y: 10 }, 80, 20)).toEqual({
      x: 0.5,
      y: 1,
    })
    expect(normalizeLogoClickPoint({ x: 100, y: -100 }, 80, 20)).toEqual({
      x: 1,
      y: -1,
    })
    expect(normalizeLogoClickPoint({ x: 1, y: 1 }, 0, 20)).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('maps click position to perpendicular flick spin axis', () => {
    expect(getFlickSpinAxis({ x: 0, y: 10 })).toEqual({ x: -1, y: 0, z: 0 })
    expect(getFlickSpinAxis({ x: 10, y: 0 })).toEqual({ x: 0, y: 1, z: 0 })
    expect(getFlickSpinAxis({ x: 0, y: -10 })).toEqual({ x: 1, y: 0, z: 0 })
    expect(getFlickSpinAxis({ x: 0, y: 0 })).toEqual({ x: 0, y: 1, z: 0 })
  })
})
