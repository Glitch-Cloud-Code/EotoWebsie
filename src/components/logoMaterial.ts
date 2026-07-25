import { Color, DoubleSide, MeshPhysicalMaterial } from 'three'
import { LOGO_MATERIAL_FRONT_AXIS } from './logoAsset'

export const LOGO_MATERIAL_PRESET = {
  bevelColor: '#f8f5ef',
  clearcoat: 0.14,
  clearcoatRoughness: 0.34,
  faceColor: '#d9dee2',
  metalness: 0.9,
  roughness: 0.34,
  sideColor: '#292d33',
} as const

const FORGED_METAL_SHADER_KEY = 'eoto-forged-metal-v2'

export function createForgedMetalMaterial() {
  const material = new MeshPhysicalMaterial({
    clearcoat: LOGO_MATERIAL_PRESET.clearcoat,
    clearcoatRoughness: LOGO_MATERIAL_PRESET.clearcoatRoughness,
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 1.15,
    metalness: LOGO_MATERIAL_PRESET.metalness,
    opacity: 1,
    roughness: LOGO_MATERIAL_PRESET.roughness,
    side: DoubleSide,
    transparent: false,
  })

  material.name = 'logo-forged-metal'
  material.customProgramCacheKey = () => FORGED_METAL_SHADER_KEY
  material.onBeforeCompile = (shader) => {
    shader.uniforms.logoBevelColor = {
      value: new Color(LOGO_MATERIAL_PRESET.bevelColor),
    }
    shader.uniforms.logoFaceColor = {
      value: new Color(LOGO_MATERIAL_PRESET.faceColor),
    }
    shader.uniforms.logoSideColor = {
      value: new Color(LOGO_MATERIAL_PRESET.sideColor),
    }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLogoObjectNormal;
        varying vec3 vLogoObjectPosition;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vLogoObjectNormal = objectNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLogoObjectPosition = position;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLogoObjectNormal;
        varying vec3 vLogoObjectPosition;
        uniform vec3 logoBevelColor;
        uniform vec3 logoFaceColor;
        uniform vec3 logoSideColor;

        float logoHash(vec3 value) {
          value = fract(value * 0.1031);
          value += dot(value, value.yzx + 33.33);
          return fract((value.x + value.y) * value.z);
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 logoFrontAxis = normalize(vec3(
          ${LOGO_MATERIAL_FRONT_AXIS[0].toFixed(1)},
          ${LOGO_MATERIAL_FRONT_AXIS[1].toFixed(1)},
          ${LOGO_MATERIAL_FRONT_AXIS[2].toFixed(1)}
        ));
        float logoAlignment = abs(dot(normalize(vLogoObjectNormal), logoFrontAxis));
        float logoFrontMask = smoothstep(0.78, 0.94, logoAlignment);
        float logoBevelMask =
          smoothstep(0.14, 0.66, logoAlignment) *
          (1.0 - smoothstep(0.7, 0.92, logoAlignment));

        vec3 logoMetalColor = mix(logoSideColor, logoFaceColor, logoFrontMask);
        logoMetalColor = mix(logoMetalColor, logoBevelColor, logoBevelMask * 0.82);

        float logoGrain = logoHash(floor(vLogoObjectPosition * vec3(3.2, 8.0, 3.2)));
        float logoPits = smoothstep(0.95, 0.992, logoGrain);
        float logoScratchWave =
          0.5 + 0.5 * sin(vLogoObjectPosition.y * 23.0 + logoGrain * 8.0);
        float logoScratches = pow(logoScratchWave, 32.0) * logoFrontMask;
        logoMetalColor *= 1.0 - logoPits * 0.1;
        logoMetalColor += logoScratches * 0.045;
        diffuseColor.rgb *= logoMetalColor;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float logoSurfaceRoughness = mix(0.48, 0.31, logoFrontMask);
        logoSurfaceRoughness = mix(logoSurfaceRoughness, 0.2, logoBevelMask);
        roughnessFactor = clamp(
          logoSurfaceRoughness + (logoGrain - 0.5) * 0.05,
          0.18,
          0.54
        );`,
      )
  }

  return material
}
