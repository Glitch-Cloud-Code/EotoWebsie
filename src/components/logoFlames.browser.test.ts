import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
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

      if (alpha > 70 && red > 185 && green > 52 && green < 190 && blue < 70 && red > green * 1.4) {
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

async function readIsolatedLogoBounds(
  page: Awaited<ReturnType<Browser['newPage']>>,
) {
  return page.evaluate(() => {
    const scene = window.__EOTO_LOGO_SCENE__
    const model = scene?.getObjectByName('logo-glb-model')
    const canvas = document.querySelector('canvas')
    const gl =
      canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ??
      canvas?.getContext('webgl', { preserveDrawingBuffer: true })

    if (!scene || !model || !canvas || !gl || !window.__EOTO_RENDER_LOGO_FRAME__) {
      throw new Error('Logo bounds diagnostics unavailable')
    }

    const visibility: Array<[typeof model, boolean]> = []
    const isModelObject = (object: typeof model) => {
      let current: typeof model | null = object
      while (current) {
        if (current === model) {
          return true
        }
        current = current.parent
      }
      return false
    }

    scene.traverse((object) => {
      if ('material' in object && !isModelObject(object)) {
        visibility.push([object, object.visible])
        object.visible = false
      }
    })
    window.__EOTO_RENDER_LOGO_FRAME__()

    const pixels = new Uint8Array(canvas.width * canvas.height * 4)
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    )

    let maxX = 0
    let maxY = 0
    let minX = canvas.width
    let minY = canvas.height
    for (let index = 0; index < pixels.length; index += 4) {
      const intensity =
        pixels[index] + pixels[index + 1] + pixels[index + 2]
      if (pixels[index + 3] < 15 || intensity < 35) {
        continue
      }

      const pixelIndex = index / 4
      const x = pixelIndex % canvas.width
      const y = Math.floor(pixelIndex / canvas.width)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    for (const [object, visible] of visibility) {
      object.visible = visible
    }
    window.__EOTO_RENDER_LOGO_FRAME__()

    return {
      bottom: minY / canvas.height,
      left: minX / canvas.width,
      right: 1 - maxX / canvas.width,
      top: 1 - maxY / canvas.height,
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
    await Promise.allSettled([browser?.close(), server?.close()])
  })

  afterEach(async () => {
    await Promise.allSettled(
      browser?.contexts().map((context) => context.close()) ?? [],
    )
  })

  it('renders visible flame-colored pixels in the hero canvas', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(1_800)

    const stats = await readLogoCanvasStats(page)

    await page.close()

    expect(stats.litPixels).toBeGreaterThan(5_000)
    expect(stats.flamePixels).toBeGreaterThan(45)
    expect(stats.flamePixels).toBeLessThan(1_600)
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

    expect(Math.min(...litSamples)).toBeGreaterThan(4_500)
    expect(Math.max(...litSamples)).toBeGreaterThan(8_000)
  }, 35_000)

  it('keeps bare metal visible at representative rotations', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(800)

    const samples = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const root = scene?.getObjectByName('logo-rotating-root')
      const canvas = document.querySelector('canvas')
      const gl =
        canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ??
        canvas?.getContext('webgl', { preserveDrawingBuffer: true })

      if (!scene || !root || !canvas || !gl || !window.__EOTO_RENDER_LOGO_FRAME__) {
        throw new Error('Logo diagnostics unavailable')
      }

      for (const name of [
        'logo-flame-particles',
        'logo-smoke-particles',
        'logo-halo',
      ]) {
        const effect = scene.getObjectByName(name)
        if (effect) {
          effect.visible = false
        }
      }

      return [0, 45, 90, 180, 270].map((degrees) => {
        const radians = (degrees * Math.PI) / 180
        root.quaternion.set(0, Math.sin(radians / 2), 0, Math.cos(radians / 2))
        window.__EOTO_RENDER_LOGO_FRAME__?.()

        const pixels = new Uint8Array(canvas.width * canvas.height * 4)
        gl.readPixels(
          0,
          0,
          canvas.width,
          canvas.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        )

        let litPixels = 0
        let neutralPixels = 0
        let warmPixels = 0
        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index]
          const green = pixels[index + 1]
          const blue = pixels[index + 2]
          const intensity = red + green + blue

          if (
            pixels[index + 3] > 20 &&
            intensity > 185
          ) {
            litPixels += 1
          }

          if (
            pixels[index + 3] > 20 &&
            intensity > 210 &&
            Math.max(red, green, blue) - Math.min(red, green, blue) < 55
          ) {
            neutralPixels += 1
          }

          if (
            pixels[index + 3] > 20 &&
            intensity > 210 &&
            red > green * 1.25 &&
            green > blue * 1.05
          ) {
            warmPixels += 1
          }
        }

        return { degrees, litPixels, neutralPixels, warmPixels }
      })
    })

    await page.close()

    expect(samples).toHaveLength(5)
    expect(samples[0].litPixels).toBeGreaterThan(4_000)
    expect(samples[0].neutralPixels).toBeGreaterThan(1_500)
    expect(samples[0].neutralPixels).toBeGreaterThan(
      samples[0].warmPixels * 2,
    )
    expect(samples[3].neutralPixels).toBeGreaterThan(
      samples[3].warmPixels * 2,
    )
    expect(Math.min(...samples.map((sample) => sample.litPixels))).toBeGreaterThan(700)
  }, 30_000)

  it('uses the full logo hitbox when clicking outside visible geometry', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const canvas = page.locator('canvas')
    await canvas.waitFor({ state: 'visible', timeout: 10_000 })
    const bounds = await canvas.boundingBox()
    if (!bounds) {
      throw new Error('Logo canvas bounds unavailable')
    }

    await page.mouse.click(
      bounds.x + bounds.width * 0.15,
      bounds.y + bounds.height * 0.5,
    )
    await page.waitForTimeout(180)

    const state = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const root = scene?.getObjectByName('logo-rotating-root')
      const hitbox = scene?.getObjectByName('logo-hitbox')

      return {
        hitboxExists: Boolean(hitbox),
        rootRotation: root
          ? Math.abs(root.quaternion.x) +
            Math.abs(root.quaternion.y) +
            Math.abs(root.quaternion.z)
          : 0,
        sparkCount: scene?.getObjectsByProperty('name', 'logo-spark-burst').length ?? 0,
      }
    })

    await page.close()

    expect(state.hitboxExists).toBe(true)
    expect(state.rootRotation).toBeGreaterThan(0.05)
    expect(state.sparkCount).toBeGreaterThan(0)
  }, 30_000)

  it('maps top and side clicks to perpendicular flick axes', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const canvas = page.locator('canvas')
    await canvas.waitFor({ state: 'visible', timeout: 10_000 })
    const bounds = await canvas.boundingBox()
    if (!bounds) {
      throw new Error('Logo canvas bounds unavailable')
    }

    const center = {
      x: bounds.x + bounds.width * 0.5,
      y: bounds.y + bounds.height * 0.5,
    }
    await page.mouse.move(center.x, center.y)
    await page.waitForTimeout(350)
    await page.mouse.click(center.x, bounds.y + bounds.height * 0.2)
    await page.waitForTimeout(180)
    const topQuaternion = await page.evaluate(() => {
      const root = window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
      return root
        ? { x: Math.abs(root.quaternion.x), y: Math.abs(root.quaternion.y) }
        : { x: 0, y: 0 }
    })

    await page.waitForFunction(
      () => {
        const root =
          window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
        return root
          ? Math.abs(root.quaternion.x) +
              Math.abs(root.quaternion.y) +
              Math.abs(root.quaternion.z) <
              0.02
          : false
      },
      undefined,
      { timeout: 5_000 },
    )
    await page.mouse.move(center.x, center.y)
    await page.waitForTimeout(350)
    await page.mouse.click(bounds.x + bounds.width * 0.8, center.y)
    await page.waitForTimeout(180)
    const sideQuaternion = await page.evaluate(() => {
      const root = window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
      return root
        ? { x: Math.abs(root.quaternion.x), y: Math.abs(root.quaternion.y) }
        : { x: 0, y: 0 }
    })

    await page.close()

    expect(topQuaternion.x).toBeGreaterThan(topQuaternion.y * 1.5)
    expect(sideQuaternion.y).toBeGreaterThan(sideQuaternion.x * 1.5)
  }, 35_000)

  it('keeps click sparks detached from the rotating logo', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const canvas = page.locator('canvas')
    await canvas.waitFor({ state: 'visible', timeout: 10_000 })
    await canvas.click()
    await page.waitForTimeout(40)

    const first = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const spark = scene?.getObjectByName('logo-spark-burst')
      const root = scene?.getObjectByName('logo-rotating-root')
      return spark
        ? {
            parentName: spark.parent?.name ?? '',
            position: spark.position.toArray(),
            rootRotation: root
              ? Math.abs(root.quaternion.x) +
                Math.abs(root.quaternion.y) +
                Math.abs(root.quaternion.z)
              : 0,
          }
        : null
    })

    await page.close()

    expect(first).not.toBeNull()
    expect(first?.parentName).not.toBe('logo-rotating-root')
    expect(first?.position).toHaveLength(3)
    expect(first?.rootRotation).toBeGreaterThan(0)
  }, 30_000)

  it('renders an upright, opaque GLB model', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(500)
    const renderedBounds = await readIsolatedLogoBounds(page)

    const modelState = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const model = scene?.getObjectByName('logo-glb-model')
      const transform = scene?.getObjectByName('logo-glb-transform')
      if (!model || !transform) {
        return null
      }

      const materials: {
        depthTest: boolean
        emissiveIntensity: number
        materialName: string
        meshName: string
        opacity: number
        transparent: boolean
      }[] = []
      const bounds = {
        maxX: Number.NEGATIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
        minX: Number.POSITIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
      }

      model.traverse((object) => {
        if ('material' in object) {
          const material = object.material as {
            depthTest: boolean
            emissiveIntensity: number
            name: string
            opacity: number
            transparent: boolean
          }
          materials.push({
            depthTest: material.depthTest,
            emissiveIntensity: material.emissiveIntensity,
            materialName: material.name,
            meshName: object.name,
            opacity: material.opacity,
            transparent: material.transparent,
          })
        }

        if ('geometry' in object) {
          const position = (
            object.geometry as {
              attributes: {
                position?: {
                  count: number
                  getX: (index: number) => number
                  getY: (index: number) => number
                  getZ: (index: number) => number
                }
              }
            }
          ).attributes.position
          if (!position) {
            return
          }

          object.updateWorldMatrix(true, false)
          const elements = object.matrixWorld.elements
          for (let index = 0; index < position.count; index += 1) {
            const x = position.getX(index)
            const y = position.getY(index)
            const z = position.getZ(index)
            const worldX =
              elements[0] * x +
              elements[4] * y +
              elements[8] * z +
              elements[12]
            const worldZ =
              elements[2] * x +
              elements[6] * y +
              elements[10] * z +
              elements[14]

            bounds.minX = Math.min(bounds.minX, worldX)
            bounds.maxX = Math.max(bounds.maxX, worldX)
            bounds.minZ = Math.min(bounds.minZ, worldZ)
            bounds.maxZ = Math.max(bounds.maxZ, worldZ)
          }
        }
      })

      return {
        frontAspect:
          (bounds.maxX - bounds.minX) /
          Math.max(bounds.maxZ - bounds.minZ, Number.EPSILON),
        materialCount: materials.length,
        materials,
        transformScaleY: transform.scale.y,
      }
    })

    await page.close()

    expect(modelState).not.toBeNull()
    expect(
      Math.min(
        renderedBounds.left,
        renderedBounds.right,
        renderedBounds.top,
        renderedBounds.bottom,
      ),
    ).toBeGreaterThanOrEqual(0.055)
    expect(modelState?.frontAspect).toBeGreaterThan(20)
    expect(modelState?.transformScaleY).toBeGreaterThan(0)
    expect(modelState?.materialCount).toBeGreaterThan(0)
    expect(modelState?.materials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          materialName: 'logo-forged-metal-symbol',
          meshName: 'LogoSymbol',
        }),
        expect.objectContaining({
          materialName: 'logo-forged-metal-wordmark',
          meshName: 'LogoWordmark',
        }),
      ]),
    )
    const symbolMaterial = modelState?.materials.find(
      ({ meshName }) => meshName === 'LogoSymbol',
    )
    const wordmarkMaterial = modelState?.materials.find(
      ({ meshName }) => meshName === 'LogoWordmark',
    )
    expect(wordmarkMaterial?.emissiveIntensity).toBeGreaterThan(
      symbolMaterial?.emissiveIntensity ?? Number.POSITIVE_INFINITY,
    )
    expect(
      modelState?.materials.every(
        (material) =>
          material.depthTest &&
          material.opacity === 1 &&
          !material.transparent,
      ),
    ).toBe(true)
  }, 30_000)

  it('supports keyboard-triggered logo rotation', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const logo = page.locator('.logo-canvas-shell')
    await logo.waitFor({ state: 'visible', timeout: 10_000 })
    expect(await logo.getAttribute('data-rendering')).toBe('active')
    expect(await logo.getAttribute('role')).toBe('button')
    await page.waitForFunction(
      () =>
        Boolean(
          window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root'),
        ),
      undefined,
      { timeout: 10_000 },
    )
    await logo.focus()
    await logo.press('Enter')
    await page.waitForFunction(
      () =>
        document
          .querySelector('.logo-canvas-shell')
          ?.getAttribute('data-spin-request') === '1',
      undefined,
      { timeout: 2_000 },
    )
    await page.waitForFunction(
      () => {
        const root =
          window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
        return root
          ? Math.abs(root.quaternion.x) +
              Math.abs(root.quaternion.y) +
              Math.abs(root.quaternion.z) >
              0.05
          : false
      },
      undefined,
      { timeout: 5_000 },
    )
    const rotation = await page.evaluate(() => {
      const root =
        window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
      return root
        ? Math.abs(root.quaternion.x) +
            Math.abs(root.quaternion.y) +
            Math.abs(root.quaternion.z)
        : 0
    })

    await page.close()
    expect(rotation).toBeGreaterThan(0.05)
  }, 30_000)

  it('removes animated effects when reduced motion is requested', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(500)

    const state = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const root = scene?.getObjectByName('logo-rotating-root')

      return {
        flame: Boolean(scene?.getObjectByName('logo-flame-particles')),
        halo: Boolean(scene?.getObjectByName('logo-halo')),
        rotation: root
          ? Math.abs(root.quaternion.x) +
              Math.abs(root.quaternion.y) +
              Math.abs(root.quaternion.z)
          : 0,
        smoke: Boolean(scene?.getObjectByName('logo-smoke-particles')),
        sparks:
          scene?.getObjectsByProperty('name', 'logo-spark-burst').length ?? 0,
      }
    })
    const shell = page.locator('.logo-canvas-shell')

    expect(await shell.getAttribute('role')).toBe('img')
    expect(state.flame).toBe(false)
    expect(state.halo).toBe(true)
    expect(state.rotation).toBeLessThan(0.01)
    expect(state.smoke).toBe(false)
    expect(state.sparks).toBe(0)

    await page.close()
  }, 30_000)

  it('keeps the concert-first hero contained across target viewports', async () => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const logo = page.locator('.logo-canvas-shell')
    await logo.waitFor({ state: 'visible', timeout: 10_000 })
    expect(await logo.getAttribute('data-logo-quality')).toBe('high')

    const desktopBounds = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section')
      const logo = document.querySelector('.logo-canvas-shell')
      const platforms = document.querySelector('.hero-platform-links')
      const booking = document.querySelector('.empty-state a')
      if (!hero || !logo || !platforms || !booking) {
        throw new Error('Desktop hero bounds unavailable')
      }

      const heroBounds = hero.getBoundingClientRect()
      const logoBounds = logo.getBoundingClientRect()
      const platformBounds = platforms.getBoundingClientRect()
      const targetHeights = [
        booking.getBoundingClientRect().height,
        ...Array.from(platforms.querySelectorAll('a')).map(
          (link) => link.getBoundingClientRect().height,
        ),
      ]

      return {
        heroBottom: heroBounds.bottom,
        innerHeight: window.innerHeight,
        logoWidth: logoBounds.width,
        platformBottom: platformBounds.bottom,
        targetHeights,
      }
    })
    expect(desktopBounds.heroBottom).toBeLessThanOrEqual(
      desktopBounds.innerHeight + 1,
    )
    expect(desktopBounds.platformBottom).toBeLessThanOrEqual(
      desktopBounds.innerHeight + 1,
    )
    expect(desktopBounds.logoWidth).toBeGreaterThanOrEqual(580)
    expect(desktopBounds.logoWidth).toBeLessThanOrEqual(620)
    expect(Math.min(...desktopBounds.targetHeights)).toBeGreaterThanOrEqual(44)
    expect(await page.locator('.hero-statement').count()).toBe(0)
    expect(await page.locator('.hero-section h1.visually-hidden').count()).toBe(1)

    await page.setViewportSize({ width: 1366, height: 768 })
    const shortDesktopBounds = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section')
      const platforms = document.querySelector('.hero-platform-links')
      if (!hero || !platforms) {
        throw new Error('Short desktop hero bounds unavailable')
      }

      return {
        heroBottom: hero.getBoundingClientRect().bottom,
        innerHeight: window.innerHeight,
        platformBottom: platforms.getBoundingClientRect().bottom,
      }
    })
    expect(shortDesktopBounds.heroBottom).toBeLessThanOrEqual(
      shortDesktopBounds.innerHeight + 1,
    )
    expect(shortDesktopBounds.platformBottom).toBeLessThanOrEqual(
      shortDesktopBounds.innerHeight + 1,
    )

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(
      () =>
        document
          .querySelector('.logo-canvas-shell')
          ?.getAttribute('data-logo-quality') === 'low',
      undefined,
      { timeout: 10_000 },
    )
    expect(await logo.getAttribute('data-logo-quality')).toBe('low')
    expect(await logo.getAttribute('data-rendering')).toBe('active')
    await page.waitForFunction(
      () => Boolean(window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-glb-model')),
      undefined,
      { timeout: 10_000 },
    )
    const mobileBounds = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section')
      const logo = document.querySelector('.logo-canvas-shell')
      const shows = document.querySelector('.shows-block')
      const platforms = document.querySelector('.hero-platform-links')
      if (!hero || !logo || !shows || !platforms) {
        throw new Error('Mobile hero bounds unavailable')
      }

      const heroBounds = hero.getBoundingClientRect()
      const logoBounds = logo.getBoundingClientRect()
      const showsBounds = shows.getBoundingClientRect()
      const platformBounds = platforms.getBoundingClientRect()

      return {
        hero: {
          left: heroBounds.left,
          right: heroBounds.right,
        },
        innerWidth: window.innerWidth,
        logo: {
          bottom: logoBounds.bottom,
          left: logoBounds.left,
          right: logoBounds.right,
          top: logoBounds.top,
        },
        platforms: {
          left: platformBounds.left,
          right: platformBounds.right,
          top: platformBounds.top,
        },
        scrollWidth: document.documentElement.scrollWidth,
        shows: {
          bottom: showsBounds.bottom,
          left: showsBounds.left,
          right: showsBounds.right,
          top: showsBounds.top,
        },
      }
    })
    expect(mobileBounds.scrollWidth).toBeLessThanOrEqual(
      mobileBounds.innerWidth,
    )
    expect(mobileBounds.logo.left).toBeGreaterThanOrEqual(
      mobileBounds.hero.left - 1,
    )
    expect(mobileBounds.logo.right).toBeLessThanOrEqual(
      mobileBounds.hero.right + 1,
    )
    expect(mobileBounds.shows.left).toBeGreaterThanOrEqual(
      mobileBounds.hero.left - 1,
    )
    expect(mobileBounds.shows.right).toBeLessThanOrEqual(
      mobileBounds.hero.right + 1,
    )
    expect(mobileBounds.platforms.left).toBeGreaterThanOrEqual(
      mobileBounds.hero.left - 1,
    )
    expect(mobileBounds.platforms.right).toBeLessThanOrEqual(
      mobileBounds.hero.right + 1,
    )
    expect(mobileBounds.shows.bottom).toBeLessThanOrEqual(
      mobileBounds.logo.top,
    )
    expect(mobileBounds.logo.bottom).toBeLessThanOrEqual(
      mobileBounds.platforms.top,
    )
    const mobileLogoBounds = await readIsolatedLogoBounds(page)
    expect(
      Math.min(
        mobileLogoBounds.left,
        mobileLogoBounds.right,
        mobileLogoBounds.top,
        mobileLogoBounds.bottom,
      ),
    ).toBeGreaterThanOrEqual(0.05)

    await page.close()
  }, 45_000)

  it('renders the optimized Everyday artwork uncropped on desktop and mobile', async () => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${url}#everyday`, { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => {
        const image = document.querySelector<HTMLImageElement>(
          '.featured-release-artwork img',
        )
        return Boolean(image?.complete && image.naturalWidth > 0)
      },
      undefined,
      { timeout: 10_000 },
    )

    const readReleaseLayout = () =>
      page.evaluate(() => {
        const image = document.querySelector<HTMLImageElement>(
          '.featured-release-artwork img',
        )
        const section = document.querySelector('.featured-release')
        const actions = Array.from(
          document.querySelectorAll('.featured-release-actions a'),
        )
        if (!image || !section || actions.length !== 2) {
          throw new Error('Featured release layout unavailable')
        }

        const imageBounds = image.getBoundingClientRect()
        const sectionBounds = section.getBoundingClientRect()
        return {
          actionHeights: actions.map(
            (action) => action.getBoundingClientRect().height,
          ),
          image: {
            height: imageBounds.height,
            naturalHeight: image.naturalHeight,
            naturalWidth: image.naturalWidth,
            objectFit: window.getComputedStyle(image).objectFit,
            width: imageBounds.width,
          },
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          section: {
            left: sectionBounds.left,
            right: sectionBounds.right,
          },
        }
      })

    const desktop = await readReleaseLayout()
    expect(desktop.image.naturalWidth).toBe(1600)
    expect(desktop.image.naturalHeight).toBe(1600)
    expect(desktop.image.objectFit).toBe('contain')
    expect(desktop.image.width).toBeCloseTo(desktop.image.height, 0)
    expect(Math.min(...desktop.actionHeights)).toBeGreaterThanOrEqual(44)

    await page.setViewportSize({ width: 390, height: 844 })
    const mobile = await readReleaseLayout()
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.innerWidth)
    expect(mobile.image.width).toBeCloseTo(mobile.image.height, 0)
    expect(mobile.section.left).toBeGreaterThanOrEqual(15)
    expect(mobile.section.right).toBeLessThanOrEqual(mobile.innerWidth - 15)
    expect(Math.min(...mobile.actionHeights)).toBeGreaterThanOrEqual(44)

    await page.close()
  }, 30_000)

  it('renders six responsive gallery photos without clipping the page', async () => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${url}#photos`, { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => {
        const images = Array.from(
          document.querySelectorAll<HTMLImageElement>('.photo-gallery img'),
        )
        return images.length === 6 && images.every((image) => image.complete)
      },
      undefined,
      { timeout: 10_000 },
    )

    const readGalleryLayout = () =>
      page.evaluate(() => {
        const section = document.querySelector('.photo-gallery')
        const images = Array.from(
          document.querySelectorAll<HTMLImageElement>('.photo-gallery img'),
        )
        const items = Array.from(
          document.querySelectorAll('.photo-gallery-item'),
        )
        if (!section || images.length !== 6 || items.length !== 6) {
          throw new Error('Photo gallery layout unavailable')
        }

        const sectionBounds = section.getBoundingClientRect()
        return {
          captions: document.querySelectorAll('.photo-gallery figcaption').length,
          images: images.map((image) => ({
            currentSrc: image.currentSrc,
            loading: image.loading,
            naturalWidth: image.naturalWidth,
            objectFit: window.getComputedStyle(image).objectFit,
          })),
          innerWidth: window.innerWidth,
          items: items.map((item) => {
            const bounds = item.getBoundingClientRect()
            return {
              className: item.className,
              height: bounds.height,
              width: bounds.width,
            }
          }),
          scrollWidth: document.documentElement.scrollWidth,
          section: {
            left: sectionBounds.left,
            right: sectionBounds.right,
          },
        }
      })

    const desktop = await readGalleryLayout()
    expect(desktop.captions).toBe(0)
    expect(
      desktop.images.every(
        ({ currentSrc, loading, naturalWidth, objectFit }) =>
          currentSrc.includes('.webp') &&
          loading === 'lazy' &&
          naturalWidth > 0 &&
          objectFit === 'cover',
      ),
    ).toBe(true)
    expect(
      desktop.items.filter(({ className }) => className.includes('--wide')),
    ).toHaveLength(2)
    expect(
      desktop.items.filter(({ className }) => className.includes('--portrait')),
    ).toHaveLength(4)

    await page.setViewportSize({ width: 390, height: 844 })
    const mobile = await readGalleryLayout()
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.innerWidth)
    expect(mobile.section.left).toBeGreaterThanOrEqual(15)
    expect(mobile.section.right).toBeLessThanOrEqual(mobile.innerWidth - 15)
    expect(mobile.items[0].width / mobile.items[0].height).toBeCloseTo(1.6, 1)
    expect(mobile.items[1].width / mobile.items[1].height).toBeCloseTo(0.8, 1)

    await page.close()
  }, 30_000)

  it('keeps contact details and navigation usable on desktop and mobile', async () => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${url}#contact`, { waitUntil: 'domcontentloaded' })

    const readContactLayout = () =>
      page.evaluate(() => {
        const contact = document.querySelector('#contact')
        const email = document.querySelector<HTMLAnchorElement>('.contact-email')
        const socialLinks = Array.from(
          document.querySelectorAll<HTMLAnchorElement>('.contact-socials a'),
        )
        if (!contact || !email) {
          throw new Error('Contact section unavailable')
        }

        const contactBounds = contact.getBoundingClientRect()
        return {
          contact: {
            left: contactBounds.left,
            right: contactBounds.right,
          },
          email: {
            href: email.getAttribute('href'),
            text: email.textContent?.trim(),
          },
          innerWidth: window.innerWidth,
          navigationTargetsResolve: Array.from(
            document.querySelectorAll<HTMLAnchorElement>('.site-navigation a'),
          ).every((link) => Boolean(document.querySelector(link.hash))),
          scrollWidth: document.documentElement.scrollWidth,
          socialLinks: socialLinks.map((link) => ({
            rel: link.rel,
            target: link.target,
          })),
        }
      })

    const desktop = await readContactLayout()
    expect(desktop.email).toEqual({
      href: 'mailto:echoesoftheorionband@gmail.com',
      text: 'echoesoftheorionband@gmail.com',
    })
    expect(desktop.navigationTargetsResolve).toBe(true)
    expect(desktop.socialLinks).toHaveLength(4)
    expect(
      desktop.socialLinks.every(
        ({ rel, target }) =>
          rel.includes('noreferrer') &&
          rel.includes('noopener') &&
          target === '_blank',
      ),
    ).toBe(true)

    await page.setViewportSize({ width: 390, height: 844 })
    const mobile = await readContactLayout()
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.innerWidth)
    expect(mobile.contact.left).toBeGreaterThanOrEqual(15)
    expect(mobile.contact.right).toBeLessThanOrEqual(mobile.innerWidth - 15)

    await page.close()
  }, 30_000)

  it('opens and closes the mobile navigation menu', async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const logo = page.locator('.logo-canvas-shell')
    await logo.waitFor({ state: 'visible', timeout: 10_000 })
    expect(await logo.getAttribute('data-logo-quality')).toBe('low')

    const toggle = page.locator('.menu-toggle')
    await toggle.waitFor({ state: 'visible', timeout: 10_000 })
    await toggle.click()

    expect(await toggle.getAttribute('aria-expanded')).toBe('true')
    expect(await toggle.getAttribute('aria-label')).toBe('Close menu')
    expect(await page.locator('.site-navigation-open').count()).toBe(1)

    await toggle.click()
    expect(await page.locator('.site-navigation-open').count()).toBe(0)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForFunction(
      () =>
        document
          .querySelector('.logo-canvas-shell')
          ?.getAttribute('data-rendering') === 'paused',
      undefined,
      { timeout: 10_000 },
    )

    await page.close()
  }, 45_000)
})
