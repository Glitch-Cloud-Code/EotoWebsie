import {
  AdditiveBlending,
  NormalBlending,
  ShaderMaterial,
} from 'three'
import {
  PARTICLE_DEPTH_CLAMP_Z,
  PARTICLE_KIND_SETTINGS,
  type ParticleKind,
} from './logoParticles'

export function createParticleMaterial(
  kind: ParticleKind,
  pixelRatio: number,
) {
  const settings = PARTICLE_KIND_SETTINGS[kind]
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: settings.depthTest,
    blending: kind === 'flame' ? AdditiveBlending : NormalBlending,
    uniforms: {
      uAlphaMultiplier: { value: settings.alphaMultiplier },
      uFadeOutStart: { value: settings.fadeOutStart },
      uKind: { value: kind === 'flame' ? 0 : 1 },
      uPixelRatio: { value: pixelRatio },
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uFadeOutStart;
      uniform float uKind;
      attribute float aScale;
      attribute float aSeed;
      attribute vec3 aDrift;
      varying float vLife;
      varying float vKind;
      varying float vSeed;

      void main() {
        float speed = mix(0.16, 0.55, 1.0 - uKind);
        speed *= mix(0.76, 0.54, 1.0 - uKind);
        float life = fract(uTime * speed + aSeed);
        float inverseLife = 1.0 - life;
        float fadeIn = smoothstep(0.0, 0.12, life);
        float fadeOut = 1.0 - smoothstep(uFadeOutStart, 1.0, life);
        float visibility = fadeIn * fadeOut;

        vec3 transformed = position;
        transformed.x += aDrift.x * life * mix(0.42, 0.94, uKind);
        transformed.y -= aDrift.y * pow(life, mix(1.58, 1.03, uKind));
        transformed.z += aDrift.z * life;

        transformed.x += sin((uTime * mix(1.6, 4.2, 1.0 - uKind)) + aSeed * 18.0) * mix(7.0, 2.7, uKind) * inverseLife;
        transformed.z += cos((uTime * mix(1.2, 3.3, 1.0 - uKind)) + aSeed * 15.0) * mix(5.0, 1.9, uKind) * inverseLife;
        transformed.y -= sin((uTime * mix(0.8, 2.0, 1.0 - uKind)) + aSeed * 13.0) * mix(8.5, 2.8, uKind) * inverseLife;
        transformed.z = min(transformed.z, ${PARTICLE_DEPTH_CLAMP_Z.toFixed(1)});

        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aScale * uPixelRatio * mix(1.95, 2.65, uKind) * (visibility + 0.24) / max(0.3, -mvPosition.z * 0.05);

        vLife = life;
        vKind = uKind;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uAlphaMultiplier;
      uniform float uFadeOutStart;
      varying float vLife;
      varying float vKind;
      varying float vSeed;

      void main() {
        vec2 centered = gl_PointCoord - vec2(0.5);
        float distanceToCenter = length(centered);
        if (distanceToCenter > 0.5) {
          discard;
        }

        float softEdge = smoothstep(0.5, 0.0, distanceToCenter);
        float inverseLife = 1.0 - vLife;
        float fadeIn = smoothstep(0.0, 0.12, vLife);
        float fadeOut = 1.0 - smoothstep(uFadeOutStart, 1.0, vLife);
        float visibility = fadeIn * fadeOut;
        vec3 color;
        float alpha;

        if (vKind < 0.5) {
          vec3 ember = vec3(0.92, 0.035, 0.012);
          vec3 flame = vec3(1.0, 0.27, 0.045);
          vec3 core = vec3(1.0, 0.74, 0.3);
          color = mix(ember, flame, smoothstep(0.0, 0.45, inverseLife));
          color = mix(color, core, pow(inverseLife, 2.2));
          alpha = softEdge * visibility * (0.32 + pow(inverseLife, 0.7)) * uAlphaMultiplier;
        } else {
          vec3 denseSmoke = vec3(0.1, 0.08, 0.08);
          vec3 lightSmoke = vec3(0.58, 0.5, 0.49);
          color = mix(denseSmoke, lightSmoke, smoothstep(0.0, 1.0, vLife));
          alpha = softEdge * visibility * pow(inverseLife, 1.05) * uAlphaMultiplier;
        }

        alpha *= 0.8 + sin(vSeed * 41.0 + vLife * 12.0) * 0.08;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  material.name = `logo-${kind}-particles`
  return material
}
