import { AdditiveBlending, ShaderMaterial } from 'three'

export const LOGO_HALO_ALPHA = 0.14
export const LOGO_HALO_RENDER_ORDER = 0
export const LOGO_HALO_SCALE = 0.031
export const LOGO_HALO_Z = -42

export function createLogoHaloMaterial() {
  return new ShaderMaterial({
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;

      void main() {
        vec2 centered = (vUv - vec2(0.5)) * vec2(1.0, 1.08);
        float radius = length(centered);
        float falloff = 1.0 - smoothstep(0.08, 0.5, radius);
        float core = 1.0 - smoothstep(0.0, 0.34, radius);
        vec3 redGlow = vec3(0.54, 0.025, 0.045);
        vec3 paleCore = vec3(0.92, 0.58, 0.46);
        vec3 color = mix(redGlow, paleCore, core * 0.32);

        gl_FragColor = vec4(color, falloff * ${LOGO_HALO_ALPHA.toFixed(2)});
      }
    `,
  })
}
