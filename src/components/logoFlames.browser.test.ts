import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'

let browser: Browser
let server: ViteDevServer
let url: string

async function readLogoCanvasStats(page: Awaited<ReturnType<Browser['newPage']>>) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      throw new Error('Logo canvas not found')
    }

    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }) ?? canvas.getContext('webgl', { preserveDrawingBuffer: true })
    if (!gl) {
      throw new Error('WebGL context not available')
    }

    const pixels = new Uint8Array(canvas.width * canvas.height * 4)
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    let flamePixels = 0
    let litPixels = 0
    let metalPixels = 0

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index]
      const green = pixels[index + 1]
      const blue = pixels[index + 2]
      const alpha = pixels[index + 3]

      if (alpha > 80 && red > 190 && green > 70 && green < 190 && blue < 70 && red > green * 1.4) {
        flamePixels += 1
      }

      if (alpha > 20 && red + green + blue > 185) {
        litPixels += 1
      }

      if (alpha > 40 && red > 90 && green > 80 && blue > 70 && Math.abs(red - green) < 80 && Math.abs(green - blue) < 90) {
        metalPixels += 1
      }
    }

    return {
      flamePixels,
      litPixels,
      metalPixels,
    }
  })
}

describe('logo flame visibility', () => {
  beforeAll(async () => {
    server = await createServer({
      configFile: 'vite.config.ts',
      logLevel: 'silent',
      server: {
        host: '127.0.0.1',
        port: 4191,
        strictPort: false,
      },
    })
    await server.listen()

    const localUrl = server.resolvedUrls?.local[0]
    if (!localUrl) {
      throw new Error('Vite dev server did not expose a local URL')
    }

    url = new URL('/EotoWebsie/', localUrl).toString()
    browser = await chromium.launch({ headless: true })
  }, 30_000)

  afterAll(async () => {
    await browser?.close()
    await server?.close()
  })

  it('renders visible flame-colored pixels in the hero canvas', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(1_800)

    const stats = await readLogoCanvasStats(page)

    await page.close()

    expect(stats.litPixels).toBeGreaterThan(5_000)
    expect(stats.flamePixels).toBeGreaterThan(80)
  }, 30_000)

  it('keeps the logo lit during a full click spin', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(1_200)

    const canvas = page.locator('canvas')
    await canvas.click()

    const samples = []
    for (const delay of [150, 350, 650, 950, 1_250]) {
      await page.waitForTimeout(delay)
      samples.push(await readLogoCanvasStats(page))
    }

    await page.close()

    const litSamples = samples.map((sample) => sample.litPixels)

    expect(Math.min(...litSamples)).toBeGreaterThan(5_000)
    expect(Math.max(...litSamples)).toBeGreaterThan(8_000)
  }, 35_000)
})
