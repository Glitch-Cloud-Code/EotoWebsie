import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
} from 'three'
import {
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_NEAR_FADE,
  LOGO_GOD_RAY_SWAY,
} from './logoGodRays'

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
      uniform float uTime;
      attribute float aFade;
      attribute float aSeed;
      varying float vFade;
      varying float vSeed;

      void main() {
        float rayTipWeight =
          1.0 - clamp(aFade / ${LOGO_GOD_RAY_NEAR_FADE.toFixed(2)}, 0.0, 1.0);
        float raySway =
          sin(uTime * 0.18 + aSeed * 6.28318) *
          ${LOGO_GOD_RAY_SWAY.toFixed(3)} *
          rayTipWeight;
        float rayBreathing =
          1.0 +
          sin(uTime * 0.12 + aSeed * 11.0) *
          0.018 *
          rayTipWeight;
        float rayCosine = cos(raySway);
        float raySine = sin(raySway);
        vec2 animatedPosition = position.xy * rayBreathing;
        animatedPosition = mat2(
          rayCosine,
          -raySine,
          raySine,
          rayCosine
        ) * animatedPosition;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(
          animatedPosition,
          position.z,
          1.0
        );
        vFade = aFade;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying float vFade;
      varying float vSeed;

      void main() {
        float shimmer = 0.78 + sin(uTime * 0.18 + vSeed * 21.0) * 0.05;
        vec3 warmCore = vec3(0.88, 0.30, 0.20);
        vec3 bloodEdge = vec3(0.62, 0.025, 0.055);
        vec3 color = mix(bloodEdge, warmCore, 0.52 + 0.12 * sin(vSeed * 12.0));
        float alpha = vFade * ${LOGO_GOD_RAY_ALPHA.toFixed(2)} * shimmer;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}
