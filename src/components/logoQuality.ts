import type { ParticleKind } from './logoParticles'

export type LogoQuality = 'high' | 'low'

export function getLogoDpr(quality: LogoQuality): number | [number, number] {
  return quality === 'low' ? 1 : [1, 1.5]
}

export function getParticleCount(
  kind: ParticleKind,
  baseCount: number,
  quality: LogoQuality,
) {
  if (quality === 'high') {
    return baseCount
  }

  const multiplier = kind === 'flame' ? 0.5 : 0
  return Math.round(baseCount * multiplier)
}

export function shouldRenderSmoke(quality: LogoQuality) {
  return quality === 'high'
}
