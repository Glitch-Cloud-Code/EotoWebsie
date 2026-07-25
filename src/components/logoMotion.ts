export const LOGO_MOTION = {
  maxAnimationDeltaSeconds: 1 / 20,
  maxTiltX: (4 * Math.PI) / 180,
  maxTiltY: (6 * Math.PI) / 180,
  spinDurationSeconds: 1.35,
  tiltDamping: 2.8,
} as const

export function getDampingFactor(deltaSeconds: number, damping: number) {
  if (deltaSeconds <= 0 || damping <= 0) {
    return 0
  }

  return 1 - Math.exp(-deltaSeconds * damping)
}

export function easeOutCubic(progress: number) {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  return 1 - Math.pow(1 - clampedProgress, 3)
}
