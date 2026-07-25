import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import {
  getLogoCameraDistance,
  LOGO_CAMERA_FOV,
} from './logoCameraLayout'
import type { LogoQuality } from './logoQuality'

type LogoCameraProps = {
  height: number
  quality: LogoQuality
  width: number
}

export function LogoCamera({ height, quality, width }: LogoCameraProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return
    }

    const aspect = size.height > 0 ? size.width / size.height : 1
    camera.fov = LOGO_CAMERA_FOV
    camera.position.set(
      0,
      0,
      getLogoCameraDistance(width, height, quality, aspect),
    )
    camera.updateProjectionMatrix()
  }, [camera, height, quality, size.height, size.width, width])

  return null
}
