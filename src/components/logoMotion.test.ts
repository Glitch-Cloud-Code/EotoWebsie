import { describe, expect, it } from 'vitest'
import {
  easeOutCubic,
  getDampingFactor,
  LOGO_MOTION,
} from './logoMotion'

describe('logo motion', () => {
  it('uses restrained heavy-object motion values', () => {
    expect(LOGO_MOTION.maxTiltX).toBeCloseTo((4 * Math.PI) / 180)
    expect(LOGO_MOTION.maxTiltY).toBeCloseTo((6 * Math.PI) / 180)
    expect(LOGO_MOTION.spinDurationSeconds).toBeGreaterThanOrEqual(1.25)
    expect(LOGO_MOTION.spinDurationSeconds).toBeLessThanOrEqual(1.4)
    expect(LOGO_MOTION.tiltDamping).toBeLessThanOrEqual(3)
  })

  it('calculates frame-rate-independent damping and bounded easing', () => {
    expect(getDampingFactor(0, LOGO_MOTION.tiltDamping)).toBe(0)
    expect(getDampingFactor(1 / 60, LOGO_MOTION.tiltDamping)).toBeCloseTo(
      0.0456,
      3,
    )
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(0.5)).toBe(0.875)
    expect(easeOutCubic(2)).toBe(1)
  })
})
