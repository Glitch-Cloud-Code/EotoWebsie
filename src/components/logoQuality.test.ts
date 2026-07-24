import { describe, expect, it } from 'vitest'
import {
  getLogoDpr,
  getParticleCount,
  shouldRenderSmoke,
} from './logoQuality'

describe('logo quality tiers', () => {
  it('caps mobile rendering work', () => {
    expect(getLogoDpr('low')).toBe(1)
    expect(getParticleCount('flame', 210, 'low')).toBe(105)
    expect(getParticleCount('smoke', 120, 'low')).toBe(0)
    expect(shouldRenderSmoke('low')).toBe(false)
  })

  it('keeps restrained desktop quality', () => {
    expect(getLogoDpr('high')).toEqual([1, 1.5])
    expect(getParticleCount('flame', 210, 'high')).toBe(210)
    expect(getParticleCount('smoke', 120, 'high')).toBe(120)
    expect(shouldRenderSmoke('high')).toBe(true)
  })
})
