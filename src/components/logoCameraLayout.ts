import type { LogoQuality } from './logoQuality'
import { LOGO_MODEL_SCALE } from './logoSparks'

export const LOGO_CAMERA_FOV = 26
export const LOGO_CAMERA_FILL = {
  high: 0.84,
  low: 0.87,
} as const satisfies Record<LogoQuality, number>

export function getLogoCameraDistance(
  width: number,
  height: number,
  quality: LogoQuality,
  aspect = 1,
) {
  const safeAspect = Math.max(aspect, 0.1)
  const halfFovRadians = (LOGO_CAMERA_FOV * Math.PI) / 360
  const tangent = Math.tan(halfFovRadians)
  const fill = LOGO_CAMERA_FILL[quality]
  const sceneWidth = width * LOGO_MODEL_SCALE
  const sceneHeight = height * LOGO_MODEL_SCALE
  const horizontalDistance =
    sceneWidth / (2 * tangent * safeAspect * fill)
  const verticalDistance = sceneHeight / (2 * tangent * fill)

  return Math.max(horizontalDistance, verticalDistance)
}
