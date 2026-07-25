import { PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import logoMetadata from '../assets/logoMetadata.json'
import {
  applyLogoCameraLayout,
  getLogoCameraDistance,
  LOGO_CAMERA_FILL,
  LOGO_CAMERA_FOV,
} from './logoCameraLayout'

describe('logo camera layout', () => {
  it('fits logo bounds inside a stable square safe area', () => {
    const distance = getLogoCameraDistance(
      logoMetadata.width,
      logoMetadata.height,
      'high',
    )

    expect(LOGO_CAMERA_FOV).toBe(26)
    expect(LOGO_CAMERA_FILL.high).toBeGreaterThanOrEqual(0.8)
    expect(LOGO_CAMERA_FILL.high).toBeLessThanOrEqual(0.85)
    expect(distance).toBeGreaterThan(170)
    expect(distance).toBeLessThan(176)
  })

  it('fills slightly more space on low-quality narrow layouts', () => {
    const high = getLogoCameraDistance(
      logoMetadata.width,
      logoMetadata.height,
      'high',
    )
    const low = getLogoCameraDistance(
      logoMetadata.width,
      logoMetadata.height,
      'low',
    )
    const portrait = getLogoCameraDistance(
      logoMetadata.width,
      logoMetadata.height,
      'low',
      0.75,
    )

    expect(low).toBeLessThan(high)
    expect(portrait).toBeGreaterThan(low)
  })

  it('applies the computed layout through one camera adapter', () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 1_000)
    const previousProjection = camera.projectionMatrix.clone()

    applyLogoCameraLayout(camera, 172)

    expect(camera.fov).toBe(LOGO_CAMERA_FOV)
    expect(camera.position.toArray()).toEqual([0, 0, 172])
    expect(camera.projectionMatrix.equals(previousProjection)).toBe(false)
  })
})
