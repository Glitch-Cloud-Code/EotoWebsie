import { describe, expect, it } from 'vitest'
import {
  createParticleAttributes,
  PARTICLE_DEPTH_CLAMP_Z,
  PARTICLE_KIND_SETTINGS,
  sampleBottomEmittersFromTextShapes,
  spreadEmittersAcrossBand,
  type Point2D,
  type ShapeSampler,
} from './logoParticles'

function shape(points: Point2D[]): ShapeSampler {
  return {
    getLength: () => 320,
    getSpacedPoints: () => points,
  }
}

function seededRandom() {
  let seed = 7

  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('logo particle emitters', () => {
  it('samples only bottom edges from wordmark-height text shapes', () => {
    const textLetter = shape([
      { x: 100, y: 1400 },
      { x: 160, y: 1400 },
      { x: 160, y: 1640 },
      { x: 100, y: 1640 },
      { x: 130, y: 1620 },
    ])
    const decorativeGeometry = shape([
      { x: 100, y: 1700 },
      { x: 500, y: 1700 },
      { x: 500, y: 2300 },
      { x: 100, y: 2300 },
    ])

    const emitters = sampleBottomEmittersFromTextShapes([textLetter, decorativeGeometry], 100, 1400)

    expect(emitters).toEqual([
      { x: 60, y: 240 },
      { x: 0, y: 240 },
      { x: 30, y: 220 },
    ])
  })

  it('spreads flame emitters by x bucket while keeping bottom points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 2, y: 12 },
      { x: 10, y: 4 },
      { x: 12, y: 24 },
    ]

    expect(spreadEmittersAcrossBand(points, 2, 'bottom')).toEqual([
      { x: 2, y: 12 },
      { x: 12, y: 24 },
    ])
  })

  it('creates larger, longer-lived particles behind the logo text', () => {
    const emitters = [
      { x: -10, y: 4 },
      { x: 20, y: 8 },
    ]

    for (const kind of ['flame', 'smoke'] as const) {
      const settings = PARTICLE_KIND_SETTINGS[kind]
      const { drifts, positions, scales } = createParticleAttributes(emitters, kind, seededRandom())
      const zValues = Array.from({ length: settings.count }, (_, index) => positions[index * 3 + 2])
      const yDrifts = Array.from({ length: settings.count }, (_, index) => drifts[index * 3 + 1])

      expect(positions).toHaveLength(settings.count * 3)
      expect(Math.max(...zValues)).toBeLessThanOrEqual(PARTICLE_DEPTH_CLAMP_Z)
      expect(Math.min(...zValues)).toBeGreaterThanOrEqual(settings.startZ[0])
      expect(Math.max(...zValues)).toBeLessThanOrEqual(settings.startZ[1])
      expect(new Set(zValues.map((value) => value.toFixed(1))).size).toBeGreaterThan(20)
      expect(Math.min(...Array.from(scales))).toBeGreaterThanOrEqual(settings.scale[0])
      expect(Math.max(...Array.from(scales))).toBeLessThanOrEqual(settings.scale[1])
      expect(Math.min(...yDrifts)).toBeGreaterThanOrEqual(settings.driftY[0])
      expect(Math.max(...yDrifts)).toBeLessThanOrEqual(settings.driftY[1])
      expect(settings.fadeOutStart).toBeGreaterThanOrEqual(0.9)
    }
  })
})
