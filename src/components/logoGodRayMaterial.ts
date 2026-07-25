import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
} from 'three'
import {
  LOGO_GOD_RAY_ALPHA,
  LOGO_GOD_RAY_BEND,
  LOGO_GOD_RAY_DEPTH_SWAY,
  LOGO_GOD_RAY_EDGE_FADE_NDC,
  LOGO_GOD_RAY_HAZE_ALPHA,
  LOGO_GOD_RAY_LIFECYCLE_SECONDS,
  LOGO_GOD_RAY_SCALE,
  LOGO_GOD_RAY_WORDMARK_HEIGHT_RATIO,
  LOGO_GOD_RAY_WORDMARK_MIN_ALPHA,
  LOGO_GOD_RAY_WIDTH_PULSE,
} from './logoGodRays'

type GodRayMaterialOptions = {
  logoHeight: number
  profile?: 'defined' | 'haze' | 'soft'
  staticTime?: number
}

export function createGodRayMaterial({
  logoHeight,
  profile = 'defined',
  staticTime = 0,
}: GodRayMaterialOptions) {
  const alpha =
    profile === 'haze'
      ? LOGO_GOD_RAY_HAZE_ALPHA
      : profile === 'soft'
        ? 0.22
        : LOGO_GOD_RAY_ALPHA
  const hazeSpread = profile === 'haze' ? 2.4 : profile === 'soft' ? 0.9 : 0
  const edgeFalloff =
    profile === 'haze' ? 1.35 : profile === 'soft' ? 2.05 : 3.1
  const wordmarkHalfHeight =
    logoHeight * LOGO_GOD_RAY_SCALE * LOGO_GOD_RAY_WORDMARK_HEIGHT_RATIO

  const material = new ShaderMaterial({
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uTime: { value: staticTime },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aAcross;
      attribute float aAlong;
      attribute float aDepthLayer;
      attribute float aLifecycleRate;
      attribute float aLifecycleSeed;
      attribute float aMotionRate;
      attribute float aSeed;
      varying float vAcross;
      varying float vAlong;
      varying float vDepthLayer;
      varying float vLifecycleRate;
      varying float vLifecycleSeed;
      varying float vSeed;
      varying vec3 vRayPosition;
      varying vec2 vScreenPosition;

      void main() {
        float currentA =
          sin(uTime * 0.46 * aMotionRate + aSeed * 19.7 + aAlong * 3.8);
        float currentB =
          sin(uTime * 0.19 * aMotionRate + aSeed * 41.3 - aAlong * 7.2);
        float currentC =
          cos(uTime * 0.083 * aMotionRate + aSeed * 67.1 + aAlong * 2.4);
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

        vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(
          animatedPosition,
          1.0
        );
        gl_Position = clipPosition;
        vAcross = aAcross;
        vAlong = aAlong;
        vDepthLayer = aDepthLayer;
        vLifecycleRate = aLifecycleRate;
        vLifecycleSeed = aLifecycleSeed;
        vRayPosition = animatedPosition;
        vSeed = aSeed;
        vScreenPosition = clipPosition.xy / clipPosition.w;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying float vAcross;
      varying float vAlong;
      varying float vDepthLayer;
      varying float vLifecycleRate;
      varying float vLifecycleSeed;
      varying float vSeed;
      varying vec3 vRayPosition;
      varying vec2 vScreenPosition;

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
          uTime * vLifecycleRate /
            ${LOGO_GOD_RAY_LIFECYCLE_SECONDS.toFixed(1)} +
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
        float surfaceRefraction = valueNoise(
          vec2(
            vSeed * 27.0 + uTime * 0.11,
            vAcross * 2.4 - uTime * 0.07
          )
        );
        density *= mix(
          0.76,
          1.2,
          surfaceRefraction * (1.0 - smoothstep(0.0, 0.3, vAlong))
        );
        float screenEdgeDistance =
          1.0 - max(abs(vScreenPosition.x), abs(vScreenPosition.y));
        float screenEdgeFade = smoothstep(
          0.0,
          ${LOGO_GOD_RAY_EDGE_FADE_NDC.toFixed(2)},
          screenEdgeDistance
        );
        float wordmarkDistance = abs(vRayPosition.y);
        float outsideWordmark = smoothstep(
          ${(wordmarkHalfHeight * 0.72).toFixed(2)},
          ${wordmarkHalfHeight.toFixed(2)},
          wordmarkDistance
        );
        float wordmarkReadability = mix(
          ${LOGO_GOD_RAY_WORDMARK_MIN_ALPHA.toFixed(2)},
          1.0,
          outsideWordmark
        );

        vec3 bloodEdge = vec3(0.25, 0.018, 0.035);
        vec3 steelCore = vec3(0.9, 0.94, 1.0);
        float coreMix = profile * (0.62 + caustic * 0.26);
        coreMix *= 1.0 - abs(vDepthLayer) * 0.08;
        vec3 color = mix(bloodEdge, steelCore, coreMix);
        float alpha =
          profile *
          entranceFade *
          exitFade *
          extinction *
          density *
          lifecycle *
          screenEdgeFade *
          wordmarkReadability *
          (1.0 - abs(vDepthLayer) * 0.12) *
          ${alpha.toFixed(2)};

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  material.name = `logo-god-rays-${profile}`
  return material
}
