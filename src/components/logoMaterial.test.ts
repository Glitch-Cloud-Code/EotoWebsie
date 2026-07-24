import { describe, expect, it } from 'vitest'
import {
  createForgedMetalMaterial,
  LOGO_MATERIAL_PRESET,
} from './logoMaterial'

describe('forged logo material', () => {
  it('stays opaque and physically metallic without UV texture maps', () => {
    const material = createForgedMetalMaterial()

    expect(material.name).toBe('logo-forged-metal')
    expect(material.transparent).toBe(false)
    expect(material.opacity).toBe(1)
    expect(material.map).toBeNull()
    expect(material.emissiveIntensity).toBe(0)
    expect(material.metalness).toBe(LOGO_MATERIAL_PRESET.metalness)
    expect(material.roughness).toBe(LOGO_MATERIAL_PRESET.roughness)

    material.dispose()
  })

  it('injects object-space front, bevel, wear, and roughness masks', () => {
    const material = createForgedMetalMaterial()
    const shader = {
      fragmentShader:
        '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>',
      uniforms: {},
      vertexShader:
        '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>',
    }

    material.onBeforeCompile(shader as never, null as never)

    expect(shader.vertexShader).toContain('vLogoObjectNormal = objectNormal')
    expect(shader.fragmentShader).toContain('logoFrontMask')
    expect(shader.fragmentShader).toContain('logoBevelMask')
    expect(shader.fragmentShader).toContain('logoPits')
    expect(shader.fragmentShader).toContain('logoSurfaceRoughness')
    expect(material.customProgramCacheKey()).toBe('eoto-forged-metal-v1')

    material.dispose()
  })
})
