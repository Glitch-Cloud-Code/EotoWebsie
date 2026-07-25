import { describe, expect, it } from 'vitest'
import {
  createGodRayGeometryData,
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_COUNT,
  LOGO_GOD_RAY_NEAR_FADE,
  LOGO_GOD_RAY_RENDER_ORDER,
  LOGO_GOD_RAY_SCALE,
  LOGO_GOD_RAY_SWAY,
  LOGO_GOD_RAY_Z,
} from './logoGodRays'
import { createSeededRandom } from '../utils/random'

describe('logo god rays', () => {
  it('creates deterministic tapered beam geometry behind logo', () => {
    const first = createGodRayGeometryData(100, 200, createSeededRandom(3))
    const second = createGodRayGeometryData(100, 200, createSeededRandom(3))

    expect(first.positions).toHaveLength(LOGO_GOD_RAY_COUNT * 6 * 3)
    expect(first.fades).toHaveLength(LOGO_GOD_RAY_COUNT * 6)
    expect(first.seeds).toHaveLength(LOGO_GOD_RAY_COUNT * 6)
    expect(Array.from(first.positions.slice(0, 18))).toEqual(Array.from(second.positions.slice(0, 18)))
    expect(new Set(Array.from({ length: first.positions.length / 3 }, (_, index) => first.positions[index * 3])).size).toBeGreaterThan(1)
    expect(Math.min(...Array.from(first.fades))).toBe(0)
    expect(Math.max(...Array.from(first.fades))).toBeCloseTo(
      LOGO_GOD_RAY_NEAR_FADE,
    )
    expect(
      Array.from({ length: first.positions.length / 3 }, (_, index) => first.positions[index * 3 + 2]).every(
        (z) => Math.abs(z - LOGO_GOD_RAY_Z) < 0.001,
      ),
    ).toBe(true)
  })

  it('renders behind particles and text overlays', () => {
    expect(LOGO_GOD_RAY_ALPHA).toBeGreaterThanOrEqual(0.04)
    expect(LOGO_GOD_RAY_ALPHA).toBeLessThanOrEqual(0.07)
    expect(LOGO_GOD_RAY_COUNT).toBeLessThanOrEqual(8)
    expect(LOGO_GOD_RAY_NEAR_FADE).toBeLessThanOrEqual(0.55)
    expect(LOGO_GOD_RAY_SWAY).toBeLessThanOrEqual(0.025)
    expect(LOGO_GOD_RAY_Z).toBeLessThan(-20)
    expect(LOGO_GOD_RAY_RENDER_ORDER).toBeLessThan(5)
  })

  it('uses scene-space dimensions so rays stay visible during logo rotation', () => {
    const data = createGodRayGeometryData(100, 200, createSeededRandom(3))
    const maxAbsX = Math.max(...Array.from({ length: data.positions.length / 3 }, (_, index) => Math.abs(data.positions[index * 3])))

    expect(LOGO_GOD_RAY_SCALE).toBe(0.031)
    expect(maxAbsX).toBeLessThan(200)
  })
})
