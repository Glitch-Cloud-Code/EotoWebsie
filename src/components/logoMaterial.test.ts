import { describe, expect, it } from 'vitest'
import {
  createForgedMetalMaterial,
  LOGO_MATERIAL_PRESETS,
} from './logoMaterial'
import { LOGO_MATERIAL_FRONT_AXIS } from './logoAsset'

describe('forged logo material', () => {
  it('stays opaque and physically metallic without UV texture maps', () => {
    const material = createForgedMetalMaterial('wordmark')

    expect(material.name).toBe('logo-forged-metal-wordmark')
    expect(material.transparent).toBe(false)
    expect(material.opacity).toBe(1)
    expect(material.map).toBeNull()
    expect(material.emissiveIntensity).toBe(
      LOGO_MATERIAL_PRESETS.wordmark.emissiveIntensity,
    )
    expect(material.envMapIntensity).toBe(
      LOGO_MATERIAL_PRESETS.wordmark.envMapIntensity,
    )
    expect(material.metalness).toBe(LOGO_MATERIAL_PRESETS.wordmark.metalness)
    expect(material.roughness).toBe(LOGO_MATERIAL_PRESETS.wordmark.roughness)

    material.dispose()
  })

  it('keeps the wordmark brighter than the supporting symbol', () => {
    const symbol = LOGO_MATERIAL_PRESETS.symbol
    const wordmark = LOGO_MATERIAL_PRESETS.wordmark
    const symbolFace = Number.parseInt(symbol.faceColor.slice(1, 3), 16)
    const wordmarkFace = Number.parseInt(wordmark.faceColor.slice(1, 3), 16)

    expect(wordmarkFace).toBeGreaterThan(symbolFace * 1.5)
    expect(wordmark.emissiveIntensity).toBeGreaterThan(
      symbol.emissiveIntensity,
    )
    expect(wordmark.roughness).toBeLessThan(symbol.roughness)
  })

  it('injects object-space front, bevel, wear, and roughness masks', () => {
    const material = createForgedMetalMaterial('wordmark')
    const shader = {
      fragmentShader:
        '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>',
      uniforms: {} as Record<
        string,
        { value: { getHexString: () => string } }
      >,
      vertexShader:
        '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>',
    }

    material.onBeforeCompile(shader as never, null as never)

    expect(shader.vertexShader).toContain('vLogoObjectNormal = objectNormal')
    expect(shader.fragmentShader).toContain(
      `${LOGO_MATERIAL_FRONT_AXIS[0].toFixed(1)},`,
    )
    expect(shader.fragmentShader).toContain('logoFrontMask')
    expect(shader.fragmentShader).toContain('logoBackMask')
    expect(shader.fragmentShader).not.toContain(
      'abs(dot(normalize(vLogoObjectNormal), logoFrontAxis))',
    )
    expect(shader.fragmentShader).toContain('logoBevelMask')
    expect(shader.fragmentShader).toContain('logoPits')
    expect(shader.fragmentShader).toContain('logoSurfaceRoughness')
    expect(shader.uniforms.logoFaceColor.value.getHexString()).toBe(
      LOGO_MATERIAL_PRESETS.wordmark.faceColor.slice(1),
    )
    expect(material.customProgramCacheKey()).toBe(
      'eoto-forged-metal-v3-wordmark',
    )

    material.dispose()
  })
})
