import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './random'

describe('seeded random', () => {
  it('returns the same sequence for the same seed', () => {
    const first = createSeededRandom(1487)
    const second = createSeededRandom(1487)

    expect(Array.from({ length: 8 }, () => first())).toEqual(Array.from({ length: 8 }, () => second()))
  })

  it('keeps values in normalized range', () => {
    const random = createSeededRandom(-3)
    const values = Array.from({ length: 32 }, () => random())

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
  })
})
