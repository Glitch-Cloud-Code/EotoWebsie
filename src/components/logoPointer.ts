export type PointerTarget = {
  x: number
  y: number
}

export function normalizeViewportPointer(clientX: number, clientY: number, width: number, height: number): PointerTarget {
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 }
  }

  return {
    x: (clientX / width) * 2 - 1,
    y: -(clientY / height) * 2 + 1,
  }
}

export function getLogoTiltFromPointer(pointer: PointerTarget) {
  return {
    x: Math.max(-0.15, Math.min(0.15, -pointer.y * 0.15)),
    y: Math.max(-0.28, Math.min(0.28, -pointer.x * 0.28)),
  }
}
