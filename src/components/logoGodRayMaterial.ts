import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
} from 'three'
import { LOGO_GOD_RAY_ALPHA } from './logoGodRays'

export function createGodRayMaterial() {
  return new ShaderMaterial({
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aFade;
      attribute float aSeed;
      varying float vFade;
      varying float vSeed;

      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vFade = aFade;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying float vFade;
      varying float vSeed;

      void main() {
        float shimmer = 0.82 + sin(uTime * 0.7 + vSeed * 21.0) * 0.12;
        vec3 warmCore = vec3(0.88, 0.30, 0.20);
        vec3 bloodEdge = vec3(0.62, 0.025, 0.055);
        vec3 color = mix(bloodEdge, warmCore, 0.52 + 0.12 * sin(vSeed * 12.0));
        float alpha = vFade * ${LOGO_GOD_RAY_ALPHA.toFixed(2)} * shimmer;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}
