import { DoubleSide, MeshPhysicalMaterial } from 'three'

export const LOGO_MATERIAL_PRESET = {
  bevelColor: '#f0eee8',
  clearcoat: 0.08,
  clearcoatRoughness: 0.42,
  faceColor: '#c9ced1',
  metalness: 0.88,
  roughness: 0.38,
  sideColor: '#25272b',
} as const

const FORGED_METAL_SHADER_KEY = 'eoto-forged-metal-v1'

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

        float logoHash(vec3 value) {
          value = fract(value * 0.1031);
          value += dot(value, value.yzx + 33.33);
          return fract((value.x + value.y) * value.z);
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 logoFrontAxis = normalize(vec3(1.0, 0.0, 1.0));
        float logoAlignment = abs(dot(normalize(vLogoObjectNormal), logoFrontAxis));
        float logoFrontMask = smoothstep(0.82, 0.97, logoAlignment);
        float logoBevelMask =
          smoothstep(0.12, 0.68, logoAlignment) *
          (1.0 - smoothstep(0.72, 0.94, logoAlignment));

        vec3 logoSideColor = vec3(0.145, 0.153, 0.169);
        vec3 logoFaceColor = vec3(0.788, 0.808, 0.820);
        vec3 logoBevelColor = vec3(0.941, 0.933, 0.910);
        vec3 logoMetalColor = mix(logoSideColor, logoFaceColor, logoFrontMask);
        logoMetalColor = mix(logoMetalColor, logoBevelColor, logoBevelMask * 0.72);

        float logoGrain = logoHash(floor(vLogoObjectPosition * vec3(3.2, 8.0, 3.2)));
        float logoPits = smoothstep(0.91, 0.985, logoGrain);
        float logoScratchWave =
          0.5 + 0.5 * sin(vLogoObjectPosition.y * 23.0 + logoGrain * 8.0);
        float logoScratches = pow(logoScratchWave, 28.0) * logoFrontMask;
        logoMetalColor *= 1.0 - logoPits * 0.18;
        logoMetalColor += logoScratches * 0.075;
        diffuseColor.rgb *= logoMetalColor;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float logoSurfaceRoughness = mix(0.52, 0.34, logoFrontMask);
        logoSurfaceRoughness = mix(logoSurfaceRoughness, 0.24, logoBevelMask);
        roughnessFactor = clamp(
          logoSurfaceRoughness + (logoGrain - 0.5) * 0.08,
          0.2,
          0.62
        );`,
      )
  }

  return material
}
