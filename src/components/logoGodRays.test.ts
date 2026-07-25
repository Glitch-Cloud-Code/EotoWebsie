import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../utils/random'
import {
  createGodRayGeometryData,
  getGodRayFieldTransform,
  getGodRayGeometryBudget,
  getGodRayLifecycle,
  getGodRayScreenEdgeFade,
  getGodRayWordmarkMask,
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_COUNT,
  LOGO_GOD_RAY_FIELD_DRIFT,
  LOGO_GOD_RAY_FIELD_ROTATION,
  LOGO_GOD_RAY_PRIMARY_COUNT,
  LOGO_GOD_RAY_LIFECYCLE_SECONDS,
  LOGO_GOD_RAY_RENDER_ORDER,
  LOGO_GOD_RAY_SCALE,
  LOGO_GOD_RAY_SEGMENTS_HIGH,
  LOGO_GOD_RAY_SEGMENTS_LOW,
  LOGO_GOD_RAY_SOURCE_Z_MAX,
  LOGO_GOD_RAY_SOURCE_Z_MIN,
  LOGO_GOD_RAY_SUBRAY_COUNT,
  LOGO_GOD_RAY_TARGET_Z_MAX,
  LOGO_GOD_RAY_WORDMARK_MIN_ALPHA,
} from './logoGodRays'

function readPosition(positions: Float32Array, vertexIndex: number) {
  const positionIndex = vertexIndex * 3
  return {
    x: positions[positionIndex],
    y: positions[positionIndex + 1],
    z: positions[positionIndex + 2],
  }
}

describe('logo god rays', () => {
  it('creates deterministic segmented shafts with paired lifecycles', () => {
    const options = {
      quality: 'high' as const,
      random: createSeededRandom(3),
    }
    const first = createGodRayGeometryData(100, 200, options)
    const second = createGodRayGeometryData(100, 200, {
      ...options,
      random: createSeededRandom(3),
    })
    const expectedVertices =
      LOGO_GOD_RAY_COUNT * LOGO_GOD_RAY_SEGMENTS_HIGH * 6

    expect(first.positions).toHaveLength(expectedVertices * 3)
    expect(first.across).toHaveLength(expectedVertices)
    expect(first.alongs).toHaveLength(expectedVertices)
    expect(first.lifecycleSeeds).toHaveLength(expectedVertices)
    expect(first.seeds).toHaveLength(expectedVertices)
    expect(new Set(first.seeds).size).toBe(LOGO_GOD_RAY_COUNT)
    expect(new Set(first.lifecycleSeeds).size).toBe(
      LOGO_GOD_RAY_PRIMARY_COUNT,
    )
    expect(Array.from(first.positions)).toEqual(Array.from(second.positions))
    expect(Array.from(first.across.slice(0, 6))).toEqual([
      -1, 1, -1, 1, 1, -1,
    ])
    expect(Math.min(...first.alongs)).toBe(0)
    expect(Math.max(...first.alongs)).toBe(1)
    expect(
      new Set(
        Array.from(first.positions).filter((_, index) => index % 3 === 2),
      ).size,
    ).toBeGreaterThan(LOGO_GOD_RAY_SEGMENTS_HIGH)
  })

  it('forms and collapses each primary ray on a smooth cycle', () => {
    expect(getGodRayLifecycle(0, 0)).toBe(0)
    expect(
      getGodRayLifecycle(LOGO_GOD_RAY_LIFECYCLE_SECONDS * 0.28, 0),
    ).toBeCloseTo(1)
    expect(
      getGodRayLifecycle(LOGO_GOD_RAY_LIFECYCLE_SECONDS * 0.92, 0),
    ).toBe(0)
    expect(getGodRayLifecycle(LOGO_GOD_RAY_LIFECYCLE_SECONDS, 0)).toBe(0)

    const staggeredVisibility = [0, 0.25, 0.5, 0.75].map((seed) =>
      getGodRayLifecycle(0, seed),
    )
    expect(new Set(staggeredVisibility).size).toBeGreaterThan(1)
  })

  it('fans from a distant surface down and toward the viewer', () => {
    const height = 200
    const data = createGodRayGeometryData(100, height, {
      quality: 'high',
      random: createSeededRandom(7),
    })
    const verticesPerRibbon = LOGO_GOD_RAY_SEGMENTS_HIGH * 6
    const scaledHeight = height * LOGO_GOD_RAY_SCALE
    const starts: Array<{ x: number; y: number; z: number }> = []
    const ends: Array<{ x: number; y: number; z: number }> = []

    for (let ribbonIndex = 0; ribbonIndex < LOGO_GOD_RAY_COUNT; ribbonIndex += 1) {
      const firstVertex = ribbonIndex * verticesPerRibbon
      const lastSegment = firstVertex + verticesPerRibbon - 6
      const startLeft = readPosition(data.positions, firstVertex)
      const startRight = readPosition(data.positions, firstVertex + 1)
      const endLeft = readPosition(data.positions, lastSegment + 2)
      const endRight = readPosition(data.positions, lastSegment + 4)
      const start = {
        x: (startLeft.x + startRight.x) / 2,
        y: (startLeft.y + startRight.y) / 2,
        z: (startLeft.z + startRight.z) / 2,
      }
      const end = {
        x: (endLeft.x + endRight.x) / 2,
        y: (endLeft.y + endRight.y) / 2,
        z: (endLeft.z + endRight.z) / 2,
      }

      starts.push(start)
      ends.push(end)
      expect(start.y).toBeGreaterThan(scaledHeight * 0.84)
      expect(end.y).toBeLessThan(-scaledHeight * 0.74)
      expect(start.z).toBeGreaterThanOrEqual(LOGO_GOD_RAY_SOURCE_Z_MIN - 1)
      expect(start.z).toBeLessThanOrEqual(LOGO_GOD_RAY_SOURCE_Z_MAX + 1)
      expect(end.z).toBeGreaterThan(start.z + 32)
      expect(end.z).toBeLessThan(LOGO_GOD_RAY_TARGET_Z_MAX + 2)
    }

    const sourceSpan =
      Math.max(...starts.map(({ x }) => x)) -
      Math.min(...starts.map(({ x }) => x))
    const targetSpan =
      Math.max(...ends.map(({ x }) => x)) -
      Math.min(...ends.map(({ x }) => x))

    expect(sourceSpan).toBeGreaterThan(100 * LOGO_GOD_RAY_SCALE * 0.82)
    expect(targetSpan).toBeGreaterThan(sourceSpan * 1.55)
  })

  it('cuts geometry work on low-quality devices', () => {
    const highBudget = getGodRayGeometryBudget('high')
    const lowBudget = getGodRayGeometryBudget('low')
    const lowData = createGodRayGeometryData(100, 200, {
      quality: 'low',
      random: createSeededRandom(3),
    })
    const lowRibbonCount = lowBudget.primaryCount * lowBudget.subrayCount

    expect(highBudget).toEqual({
      primaryCount: LOGO_GOD_RAY_PRIMARY_COUNT,
      segments: LOGO_GOD_RAY_SEGMENTS_HIGH,
      subrayCount: LOGO_GOD_RAY_SUBRAY_COUNT,
    })
    expect(lowBudget.segments).toBe(LOGO_GOD_RAY_SEGMENTS_LOW)
    expect(lowBudget.primaryCount).toBeLessThan(highBudget.primaryCount)
    expect(lowBudget.subrayCount).toBeLessThan(highBudget.subrayCount)
    expect(lowData.positions).toHaveLength(
      lowRibbonCount * LOGO_GOD_RAY_SEGMENTS_LOW * 6 * 3,
    )
  })

  it('keeps layered field movement bounded', () => {
    const start = getGodRayFieldTransform(0)
    const later = getGodRayFieldTransform(2)

    expect(later).not.toEqual(start)
    for (const sample of [start, later]) {
      expect(Math.abs(sample.x)).toBeLessThanOrEqual(LOGO_GOD_RAY_FIELD_DRIFT)
      expect(Math.abs(sample.y)).toBeLessThanOrEqual(LOGO_GOD_RAY_FIELD_DRIFT)
      expect(Math.abs(sample.rotationZ)).toBeLessThanOrEqual(
        LOGO_GOD_RAY_FIELD_ROTATION,
      )
    }
  })

  it('softly protects the wordmark and feathers viewport edges', () => {
    expect(getGodRayWordmarkMask(0, 200)).toBe(
      LOGO_GOD_RAY_WORDMARK_MIN_ALPHA,
    )
    expect(getGodRayWordmarkMask(20, 200)).toBe(1)
    expect(getGodRayScreenEdgeFade(0, 0)).toBe(1)
    expect(getGodRayScreenEdgeFade(0.95, 0)).toBeGreaterThan(0)
    expect(getGodRayScreenEdgeFade(0.95, 0)).toBeLessThan(1)
    expect(getGodRayScreenEdgeFade(1, 0)).toBe(0)
  })

  it('keeps atmospheric output visible and behind the logo', () => {
    expect(LOGO_GOD_RAY_ALPHA).toBeGreaterThanOrEqual(0.25)
    expect(LOGO_GOD_RAY_ALPHA).toBeLessThanOrEqual(0.35)
    expect(LOGO_GOD_RAY_SOURCE_Z_MIN).toBeGreaterThan(-60)
    expect(LOGO_GOD_RAY_TARGET_Z_MAX).toBeLessThan(0)
    expect(LOGO_GOD_RAY_RENDER_ORDER).toBeLessThan(5)
  })
})
