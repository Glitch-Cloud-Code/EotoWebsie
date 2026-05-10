import { describe, expect, it } from 'vitest'
import {
  createParticleAttributes,
  isWordmarkShape,
  LOGO_RENDER_ORDER,
  PARTICLE_RANDOM_SEED,
  PARTICLE_DEPTH_CLAMP_Z,
  PARTICLE_KIND_SETTINGS,
  sampleBottomEmittersFromTextShapes,
  spreadEmittersAcrossBand,
  WORDMARK_SHAPE_BOUNDS,
  type Point2D,
  type ShapeSampler,
} from './logoParticles'
import { createSeededRandom } from '../utils/random'

function shape(points: Point2D[]): ShapeSampler {
  return {
    getLength: () => 320,
    getSpacedPoints: () => points,
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

  it('classifies wordmark geometry separately from decorative geometry', () => {
    expect(
      isWordmarkShape([
        { x: 100, y: 1400 },
        { x: 160, y: 1400 },
        { x: 160, y: 1640 },
        { x: 100, y: 1640 },
      ]),
    ).toBe(true)

    expect(
      isWordmarkShape([
        { x: 100, y: 1700 },
        { x: 500, y: 1700 },
        { x: 500, y: 2300 },
        { x: 100, y: 2300 },
      ]),
    ).toBe(false)
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
      const { drifts, positions, scales } = createParticleAttributes(emitters, kind, createSeededRandom(7))
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
      expect(settings.alphaMultiplier).toBeLessThanOrEqual(kind === 'flame' ? 1.1 : 0.25)
    }
  })

  it('keeps flames visible while preserving text readability', () => {
    expect(PARTICLE_KIND_SETTINGS.flame.alphaMultiplier).toBeGreaterThanOrEqual(0.85)
    expect(PARTICLE_KIND_SETTINGS.flame.depthTest).toBe(false)
    expect(LOGO_RENDER_ORDER.textOverlay).toBeGreaterThan(LOGO_RENDER_ORDER.particles)
  })

  it('names asset-specific wordmark bounds instead of hiding magic numbers', () => {
    expect(WORDMARK_SHAPE_BOUNDS).toEqual({
      maxHeight: 310,
      maxWidth: 340,
      maxY: 1665,
      minHeight: 36,
      minWidth: 18,
      minY: 1320,
    })
  })

  it('uses deterministic default particle randomness', () => {
    const emitters = [{ x: 10, y: 20 }]
    const first = createParticleAttributes(emitters, 'flame')
    const second = createParticleAttributes(emitters, 'flame')

    expect(PARTICLE_RANDOM_SEED).toBe(9103)
    expect(Array.from(first.positions.slice(0, 12))).toEqual(Array.from(second.positions.slice(0, 12)))
    expect(Array.from(first.scales.slice(0, 4))).toEqual(Array.from(second.scales.slice(0, 4)))
  })
})
