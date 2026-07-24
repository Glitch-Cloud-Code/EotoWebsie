import { useRef, useState, type RefObject } from 'react'
import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { Euler, Group, Quaternion, Vector3 } from 'three'
import type { LogoLayout } from './logoGeometry'
import {
  easeOutCubic,
  getDampingFactor,
  LOGO_MOTION,
} from './logoMotion'
import {
  getFlickSpinAxis,
  getLogoTiltFromPointer,
  normalizeLogoClickPoint,
  type PointerTarget,
} from './logoPointer'
import {
  findNearestLogoSurfacePoint,
  LOGO_MODEL_SCALE,
  toLogoLocalClickPoint,
  toLogoScenePoint,
  type Point3D,
} from './logoSparks'

export type LogoSparkBurst = {
  id: number
  origin: Point3D
}

type LogoInteractionOptions = {
  globalPointer: RefObject<PointerTarget>
  isTouch: boolean
  logoLayout: LogoLayout
  reduceMotion: boolean
  root: RefObject<Group | null>
  spinRequest: number
}

export function useLogoInteraction({
  globalPointer,
  isTouch,
  logoLayout,
  reduceMotion,
  root,
  spinRequest,
}: LogoInteractionOptions) {
  const spinState = useRef({
    active: false,
    axis: new Vector3(0, 1, 0),
    elapsed: 0,
    startQuaternion: new Quaternion(),
  })
  const spinQuaternion = useRef(new Quaternion())
  const processedSpinRequest = useRef(0)
  const sparkId = useRef(0)
  const [sparkBursts, setSparkBursts] = useState<LogoSparkBurst[]>([])
  const scratchVector = useRef(new Vector3())
  const targetTilt = useRef({ x: 0, y: 0 })
  const targetTiltEuler = useRef(new Euler(0, 0, 0, 'XYZ'))
  const targetTiltQuaternion = useRef(new Quaternion())

  useFrame((_, delta) => {
    const current = root.current
    if (!current) {
      return
    }

    if (spinRequest !== processedSpinRequest.current) {
      processedSpinRequest.current = spinRequest

      if (!reduceMotion && !spinState.current.active) {
        spinState.current.active = true
        spinState.current.axis.set(0, 1, 0)
        spinState.current.elapsed = 0
        spinState.current.startQuaternion.copy(current.quaternion)
      }
    }

    if (reduceMotion) {
      spinState.current.active = false
      targetTiltQuaternion.current.identity()
      current.quaternion.slerp(targetTiltQuaternion.current, Math.min(delta * 8, 1))
      return
    }

    if (!isTouch) {
      const tilt = getLogoTiltFromPointer(globalPointer.current)
      targetTilt.current.x = tilt.x
      targetTilt.current.y = tilt.y
    } else {
      targetTilt.current.x = 0
      targetTilt.current.y = 0
    }

    if (spinState.current.active) {
      spinState.current.elapsed += delta
      const progress = Math.min(
        spinState.current.elapsed / LOGO_MOTION.spinDurationSeconds,
        1,
      )
      const eased = easeOutCubic(progress)

      spinQuaternion.current.setFromAxisAngle(spinState.current.axis, eased * Math.PI * 2)
      current.quaternion.copy(spinState.current.startQuaternion).premultiply(spinQuaternion.current)

      if (progress >= 1) {
        current.quaternion.copy(spinState.current.startQuaternion)
        spinState.current.active = false
      }

      return
    }

    targetTiltEuler.current.set(targetTilt.current.x, targetTilt.current.y, 0)
    targetTiltQuaternion.current.setFromEuler(targetTiltEuler.current)
    current.quaternion.slerp(
      targetTiltQuaternion.current,
      getDampingFactor(delta, LOGO_MOTION.tiltDamping),
    )
  })

  const removeSparkBurst = (id: number) => {
    setSparkBursts((currentBursts) => currentBursts.filter((burst) => burst.id !== id))
  }

  const addSparkBurst = (eventPoint: Vector3) => {
    if (!root.current) {
      return
    }

    const rootLocalClick = root.current.worldToLocal(scratchVector.current.copy(eventPoint))
    const clickPoint = toLogoLocalClickPoint(rootLocalClick)
    const nearestPoint = findNearestLogoSurfacePoint(logoLayout.surfacePoints, clickPoint)
    const rootLocalOrigin = toLogoScenePoint(nearestPoint)
    const worldOrigin = root.current.localToWorld(
      scratchVector.current.set(rootLocalOrigin.x, rootLocalOrigin.y, rootLocalOrigin.z),
    )
    const nextBurst = {
      id: sparkId.current,
      origin: {
        x: worldOrigin.x,
        y: worldOrigin.y,
        z: worldOrigin.z,
      },
    }

    sparkId.current += 1
    setSparkBursts((currentBursts) => [...currentBursts.slice(-5), nextBurst])
  }

  const startSpin = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (reduceMotion) {
      return
    }

    addSparkBurst(event.point)

    if (!spinState.current.active && root.current) {
      const rootLocalClick = root.current.worldToLocal(
        scratchVector.current.copy(event.point),
      )
      const normalizedClick = normalizeLogoClickPoint(
        { x: rootLocalClick.x, y: rootLocalClick.y },
        logoLayout.width * LOGO_MODEL_SCALE,
        logoLayout.height * LOGO_MODEL_SCALE,
      )
      const axis = getFlickSpinAxis(normalizedClick)

      spinState.current.active = true
      spinState.current.axis.set(axis.x, axis.y, axis.z)
      spinState.current.elapsed = 0
      spinState.current.startQuaternion.copy(root.current.quaternion)
    }
  }

  return {
    removeSparkBurst,
    sparkBursts,
    startSpin,
  }
}
