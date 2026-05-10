import { CanvasTexture, RepeatWrapping } from 'three'
import { createSeededRandom, type RandomFn } from '../utils/random'

export const WORN_METAL_TEXTURE_SEED = 1487

export function createWornMetalTexture(random: RandomFn = createSeededRandom(WORN_METAL_TEXTURE_SEED)) {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  const gradient = context.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#f7f0e2')
  gradient.addColorStop(0.22, '#cabba6')
  gradient.addColorStop(0.58, '#8f7d6a')
  gradient.addColorStop(1, '#392e27')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  for (let index = 0; index < 16000; index += 1) {
    const x = random() * size
    const y = random() * size
    const noise = 45 + random() * 170
    const alpha = 0.045 + random() * 0.16
    context.fillStyle = `rgba(${noise}, ${noise - 8}, ${noise - 18}, ${alpha})`
    context.fillRect(x, y, random() * 5 + 1, random() * 5 + 1)
  }

  for (let index = 0; index < 240; index += 1) {
    const x = random() * size
    const y = random() * size
    const width = 120 + random() * 320
    const angle = (random() - 0.5) * 0.85

    context.save()
    context.translate(x, y)
    context.rotate(angle)
    context.fillStyle = `rgba(24, 18, 14, ${0.09 + random() * 0.13})`
    context.fillRect(0, 0, width, random() * 3 + 1)
    context.restore()
  }

  for (let index = 0; index < 42; index += 1) {
    const radius = 16 + random() * 60
    const x = random() * size
    const y = random() * size
    const bloom = context.createRadialGradient(x, y, 0, x, y, radius)
    bloom.addColorStop(0, 'rgba(255,247,235,0.32)')
    bloom.addColorStop(1, 'rgba(255,245,232,0)')
    context.fillStyle = bloom
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  for (let index = 0; index < 12; index += 1) {
    const radius = 38 + random() * 120
    const x = random() * size
    const y = random() * size
    const corrosion = context.createRadialGradient(x, y, 0, x, y, radius)
    corrosion.addColorStop(0, 'rgba(40,22,18,0.32)')
    corrosion.addColorStop(0.65, 'rgba(78,44,32,0.12)')
    corrosion.addColorStop(1, 'rgba(40,22,18,0)')
    context.fillStyle = corrosion
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  const nextTexture = new CanvasTexture(canvas)
  nextTexture.wrapS = RepeatWrapping
  nextTexture.wrapT = RepeatWrapping
  nextTexture.repeat.set(1.2, 1.2)
  nextTexture.needsUpdate = true
  return nextTexture
}
