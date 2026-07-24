import { describe, expect, it } from 'vitest'
import {
  createSparkAttributes,
  findNearestLogoSurfacePoint,
  LOGO_EFFECTS_TRANSFORM_SCALE,
  LOGO_MODEL_SCALE,
  LOGO_MODEL_TRANSFORM_SCALE,
  LOGO_SPARK_BURST_COUNT,
  LOGO_SPARK_Z,
  toLogoLocalClickPoint,
  toLogoScenePoint,
} from './logoSparks'
import { createSeededRandom } from '../utils/random'

describe('logo click sparks', () => {
  it('keeps GLB upright while flipping SVG-derived effects', () => {
    expect(LOGO_MODEL_TRANSFORM_SCALE).toEqual([
      LOGO_MODEL_SCALE,
      LOGO_MODEL_SCALE,
      LOGO_MODEL_SCALE,
    ])
    expect(LOGO_EFFECTS_TRANSFORM_SCALE).toEqual([
      LOGO_MODEL_SCALE,
      -LOGO_MODEL_SCALE,
      LOGO_MODEL_SCALE,
    ])
  })

  it('maps world click point into logo-local coordinates', () => {
    expect(toLogoLocalClickPoint({ x: LOGO_MODEL_SCALE * 12, y: -LOGO_MODEL_SCALE * 8, z: 0 })).toEqual({
      x: 12,
      y: 8,
    })
  })

  it('maps logo-local spark point back into detached scene coordinates', () => {
    expect(toLogoScenePoint({ x: 12, y: 8 })).toEqual({
      x: LOGO_MODEL_SCALE * 12,
      y: -LOGO_MODEL_SCALE * 8,
      z: LOGO_MODEL_SCALE * LOGO_SPARK_Z,
    })
  })

  it('chooses nearest actual logo point instead of empty hitbox space', () => {
    const points = [
      { x: -100, y: 0 },
      { x: 15, y: 20 },
      { x: 100, y: 0 },
    ]

    expect(findNearestLogoSurfacePoint(points, { x: 20, y: 18 })).toEqual({ x: 15, y: 20 })
  })

  it('creates deterministic spark burst attributes', () => {
    const first = createSparkAttributes(createSeededRandom(42))
    const second = createSparkAttributes(createSeededRandom(42))

    expect(first.positions).toHaveLength(LOGO_SPARK_BURST_COUNT * 3)
    expect(first.velocities).toHaveLength(LOGO_SPARK_BURST_COUNT * 3)
    expect(first.scales).toHaveLength(LOGO_SPARK_BURST_COUNT)
    expect(Array.from(first.velocities.slice(0, 12))).toEqual(Array.from(second.velocities.slice(0, 12)))
  })
})
