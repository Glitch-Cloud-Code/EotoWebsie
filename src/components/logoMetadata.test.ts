import { describe, expect, it } from 'vitest'
import logoMetadata from '../assets/logoMetadata.json'
import { LOGO_SURFACE_SAMPLE_LIMIT } from './logoGeometry'

describe('generated logo metadata', () => {
  it('contains finite layout bounds and particle emitters', () => {
    expect(Number.isFinite(logoMetadata.width)).toBe(true)
    expect(Number.isFinite(logoMetadata.height)).toBe(true)
    expect(logoMetadata.width).toBeGreaterThan(0)
    expect(logoMetadata.height).toBeGreaterThan(0)
    expect(logoMetadata.flameEmitters).toHaveLength(46)
    expect(logoMetadata.smokeEmitters).toHaveLength(22)
  })

  it('ships a bounded, finite surface map for click sparks', () => {
    expect(logoMetadata.surfacePoints).toHaveLength(LOGO_SURFACE_SAMPLE_LIMIT)
    expect(
      logoMetadata.surfacePoints.every(
        ({ x, y }) => Number.isFinite(x) && Number.isFinite(y),
      ),
    ).toBe(true)
  })
})
