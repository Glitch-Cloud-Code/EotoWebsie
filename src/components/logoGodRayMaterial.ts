import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
} from 'three'
import {
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_BEND,
  LOGO_GOD_RAY_DEPTH_SWAY,
  LOGO_GOD_RAY_HAZE_ALPHA,
  LOGO_GOD_RAY_LIFECYCLE_SECONDS,
  LOGO_GOD_RAY_WIDTH_PULSE,
} from './logoGodRays'

type GodRayMaterialOptions = {
  haze?: boolean
}

export function createGodRayMaterial({
  haze = false,
}: GodRayMaterialOptions = {}) {
  const alpha = haze ? LOGO_GOD_RAY_HAZE_ALPHA : LOGO_GOD_RAY_ALPHA
  const hazeSpread = haze ? 2.4 : 0
  const edgeFalloff = haze ? 1.35 : 3.1

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
      attribute float aAcross;
      attribute float aAlong;
      attribute float aLifecycleSeed;
      attribute float aSeed;
      varying float vAcross;
      varying float vAlong;
      varying float vLifecycleSeed;
      varying float vSeed;

      void main() {
        float currentA =
          sin(uTime * 0.46 + aSeed * 19.7 + aAlong * 3.8);
        float currentB =
          sin(uTime * 0.19 + aSeed * 41.3 - aAlong * 7.2);
        float currentC =
          cos(uTime * 0.083 + aSeed * 67.1 + aAlong * 2.4);
        float downstream = smoothstep(0.0, 1.0, aAlong);
        float surfaceWeight = 1.0 - downstream;
        float surfaceCurrent =
          sin(uTime * 0.37 + aLifecycleSeed * 31.0) * 0.66 +
          cos(uTime * 0.16 + aLifecycleSeed * 53.0 + 0.7) * 0.34;
        float bend =
          (currentA * 0.53 + currentB * 0.31 + currentC * 0.16) *
          ${LOGO_GOD_RAY_BEND.toFixed(1)} *
          (0.16 + downstream * 1.14);
        float widthCurrent =
          sin(uTime * 0.31 + aSeed * 29.0 + aAlong * 5.3) * 0.68 +
          cos(uTime * 0.13 + aSeed * 11.0 - aAlong * 2.1) * 0.32;

        vec3 animatedPosition = position;
        animatedPosition.x += bend;
        animatedPosition.x +=
          surfaceCurrent *
          (surfaceWeight * 2.4 + downstream * 1.1);
        animatedPosition.x +=
          aAcross *
          widthCurrent *
          ${LOGO_GOD_RAY_WIDTH_PULSE.toFixed(2)} *
          (0.38 + downstream * 0.62);
        animatedPosition.x += aAcross * ${hazeSpread.toFixed(1)};
        animatedPosition.y +=
          sin(uTime * 0.14 + aSeed * 23.0 + aAlong * 3.0) *
          0.72 *
          downstream;
        animatedPosition.z +=
          (
            sin(uTime * 0.21 + aSeed * 17.0 + aAlong * 4.2) * 0.68 +
            cos(uTime * 0.11 + aLifecycleSeed * 37.0 - aAlong * 2.7) * 0.32
          ) *
          ${LOGO_GOD_RAY_DEPTH_SWAY.toFixed(1)} *
          downstream;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(
          animatedPosition,
          1.0
        );
        vAcross = aAcross;
        vAlong = aAlong;
        vLifecycleSeed = aLifecycleSeed;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying float vAcross;
      varying float vAlong;
      varying float vLifecycleSeed;
      varying float vSeed;

      float hash21(vec2 point) {
        vec3 p3 = fract(vec3(point.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float valueNoise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        vec2 curve = local * local * (3.0 - 2.0 * local);
        float bottom = mix(
          hash21(cell),
          hash21(cell + vec2(1.0, 0.0)),
          curve.x
        );
        float top = mix(
          hash21(cell + vec2(0.0, 1.0)),
          hash21(cell + vec2(1.0, 1.0)),
          curve.x
        );
        return mix(bottom, top, curve.y);
      }

      float fbm(vec2 point) {
        float value = 0.0;
        float amplitude = 0.55;

        for (int octave = 0; octave < 3; octave += 1) {
          value += valueNoise(point) * amplitude;
          point = mat2(1.62, 1.18, -1.18, 1.62) * point + 8.37;
          amplitude *= 0.48;
        }

        return value;
      }

      void main() {
        float lifecycleCycle = fract(
          uTime / ${LOGO_GOD_RAY_LIFECYCLE_SECONDS.toFixed(1)} +
          vLifecycleSeed
        );
        float forming = smoothstep(0.0, 0.14, lifecycleCycle);
        float collapsing =
          1.0 - smoothstep(0.62, 0.92, lifecycleCycle);
        float lifecycle = forming * collapsing;
        float edge = abs(vAcross);
        float profile = exp(-${edgeFalloff.toFixed(2)} * edge * edge);
        profile *= 1.0 - smoothstep(0.72, 1.0, edge);

        vec2 densityUv = vec2(
          vAcross * 1.35 + vSeed * 8.7,
          vAlong * 5.8 - uTime * 0.17
        );
        float broadDensity = fbm(densityUv * 0.78);
        float fineDensity = valueNoise(
          densityUv * 2.65 + vec2(uTime * 0.055, -uTime * 0.21)
        );
        float breakup = smoothstep(
          0.22,
          0.82,
          broadDensity * 0.72 + fineDensity * 0.28
        );
        float caustic = smoothstep(
          0.58,
          0.86,
          valueNoise(
            vec2(
              vAcross * 3.1 + vSeed * 17.0 + uTime * 0.08,
              vAlong * 12.0 - uTime * 0.38
            )
          )
        );
        float entranceFade = smoothstep(0.0, 0.045, vAlong);
        float exitFade = 1.0 - smoothstep(0.8, 1.0, vAlong);
        float extinction = exp(-vAlong * 0.62);
        float density = 0.46 + breakup * 0.72 + caustic * 0.24;

        vec3 bloodEdge = vec3(0.48, 0.012, 0.028);
        vec3 steelCore = vec3(0.86, 0.91, 0.98);
        float coreMix = profile * (0.52 + caustic * 0.28);
        vec3 color = mix(bloodEdge, steelCore, coreMix);
        float alpha =
          profile *
          entranceFade *
          exitFade *
          extinction *
          density *
          lifecycle *
          ${alpha.toFixed(2)};

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}
