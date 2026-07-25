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

async function readIsolatedGodRayStats(
  page: Awaited<ReturnType<Browser['newPage']>>,
  timeSeconds?: number,
) {
  return page.evaluate(({ timeSeconds }) => {
    const scene = window.__EOTO_LOGO_SCENE__
    const canvas = document.querySelector('canvas')
    const ray = scene?.getObjectByName('logo-god-rays')
    const haze = scene?.getObjectByName('logo-god-ray-haze')
    const gl =
      canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ??
      canvas?.getContext('webgl', { preserveDrawingBuffer: true })

    if (!scene || !canvas || !ray || !gl || !window.__EOTO_RENDER_LOGO_FRAME__) {
      throw new Error('God-ray diagnostics unavailable')
    }

    scene.traverse((object) => {
      if (
        object !== ray &&
        object !== haze &&
        'material' in object
      ) {
        object.visible = false
      }
    })
    for (const effect of [ray, haze]) {
      if (!effect || !('material' in effect) || timeSeconds === undefined) {
        continue
      }

      const material = effect.material as {
        uniforms?: { uTime?: { value: number } }
      }
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = timeSeconds
      }
    }
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

    let visiblePixels = 0
    let totalIntensity = 0
    let weightedIntensity = 0
    const regionIntensity = [0, 0, 0]

    for (let index = 0; index < pixels.length; index += 4) {
      const intensity =
        pixels[index] + pixels[index + 1] + pixels[index + 2]

      if (pixels[index + 3] > 2 && intensity > 18) {
        visiblePixels += 1
        totalIntensity += intensity
        weightedIntensity += intensity * ((index / 4) % 997 + 1)
        const x = (index / 4) % canvas.width
        const region = Math.min(2, Math.floor((x / canvas.width) * 3))
        regionIntensity[region] += intensity
      }
    }

    return {
      totalIntensity,
      visiblePixels,
      weightedIntensity,
      regionIntensity,
    }
  }, { timeSeconds })
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
        'logo-god-rays',
      ]) {
        const effect = scene.getObjectByName(name)
        if (effect) {
          effect.visible = false
        }
      }

      return [0, 45, 90, 135, 180].map((degrees) => {
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
        for (let index = 0; index < pixels.length; index += 4) {
          if (
            pixels[index + 3] > 20 &&
            pixels[index] + pixels[index + 1] + pixels[index + 2] > 185
          ) {
            litPixels += 1
          }
        }

        return { degrees, litPixels }
      })
    })

    await page.close()

    expect(samples).toHaveLength(5)
    expect(samples[0].litPixels).toBeGreaterThan(4_000)
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

    await page.waitForTimeout(1_150)
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

  it('mounts visible halo and god-rays behind the rotating logo', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.mouse.move(640, 450)
    await page.waitForTimeout(500)

    const atmosphere = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const object = scene?.getObjectByName('logo-god-rays')
      const haze = scene?.getObjectByName('logo-god-ray-haze')
      const halo = scene?.getObjectByName('logo-halo')
      if (!object || !('material' in object) || !('geometry' in object)) {
        return null
      }

      const material = object.material as {
        depthTest: boolean
        opacity: number
        transparent: boolean
        uniforms?: { uTime?: { value: number } }
        visible: boolean
      }
      const geometry = object.geometry as {
        attributes: {
          aAcross?: { count: number }
          aAlong?: { count: number }
          aLifecycleSeed?: { count: number }
          position?: { count: number }
        }
        boundingBox?: {
          max: { z: number }
          min: { z: number }
        }
        computeBoundingBox: () => void
      }
      geometry.computeBoundingBox()

      return {
        halo: {
          parentName: halo?.parent?.name ?? '',
          visible: Boolean(halo?.visible),
          z: halo?.position.z ?? 0,
        },
        hazeVisible: Boolean(haze?.visible),
        rays: {
          alongVertexCount: geometry.attributes.aAlong?.count ?? 0,
          depthTest: material.depthTest,
          featherVertexCount: geometry.attributes.aAcross?.count ?? 0,
          lifecycleVertexCount:
            geometry.attributes.aLifecycleSeed?.count ?? 0,
          fieldMotion:
            Math.abs(object.position.x) +
            Math.abs(object.position.y) +
            Math.abs(object.rotation.z),
          parentName: object.parent?.name ?? '',
          transparent: material.transparent,
          uniformTime: material.uniforms?.uTime?.value ?? 0,
          vertexCount: geometry.attributes.position?.count ?? 0,
          visible: object.visible && material.visible,
          zMax: geometry.boundingBox?.max.z ?? 0,
          zMin: geometry.boundingBox?.min.z ?? 0,
        },
      }
    })
    const rayPixels = await readIsolatedGodRayStats(page, 0)
    const movedRayPixels = await readIsolatedGodRayStats(page, 4.75)

    await page.close()

    expect(atmosphere).not.toBeNull()
    expect(atmosphere?.halo.parentName).not.toBe('logo-rotating-root')
    expect(atmosphere?.halo.visible).toBe(true)
    expect(atmosphere?.halo.z).toBeLessThan(atmosphere?.rays.zMin ?? 0)
    expect(atmosphere?.hazeVisible).toBe(true)
    expect(atmosphere?.rays.alongVertexCount).toBe(
      atmosphere?.rays.vertexCount,
    )
    expect(atmosphere?.rays.depthTest).toBe(true)
    expect(atmosphere?.rays.featherVertexCount).toBe(
      atmosphere?.rays.vertexCount,
    )
    expect(atmosphere?.rays.lifecycleVertexCount).toBe(
      atmosphere?.rays.vertexCount,
    )
    expect(atmosphere?.rays.fieldMotion).toBeGreaterThan(0.01)
    expect(atmosphere?.rays.parentName).not.toBe('logo-rotating-root')
    expect(atmosphere?.rays.transparent).toBe(true)
    expect(atmosphere?.rays.uniformTime).toBeGreaterThan(0)
    expect(atmosphere?.rays.vertexCount).toBeGreaterThan(1_000)
    expect(atmosphere?.rays.visible).toBe(true)
    expect(atmosphere?.rays.zMin).toBeLessThan(-45)
    expect(atmosphere?.rays.zMax).toBeGreaterThan(-14)
    expect(atmosphere?.rays.zMax).toBeLessThan(0)
    expect(rayPixels.visiblePixels).toBeGreaterThan(1_000)
    expect(rayPixels.totalIntensity).toBeGreaterThan(100_000)
    expect(
      rayPixels.regionIntensity.filter((intensity) => intensity > 20_000),
    ).toHaveLength(3)
    expect(
      movedRayPixels.regionIntensity.filter((intensity) => intensity > 20_000),
    ).toHaveLength(3)
    expect(
      Math.abs(
        movedRayPixels.weightedIntensity - rayPixels.weightedIntensity,
      ),
    ).toBeGreaterThan(100_000)
  }, 30_000)

  it('renders an upright, opaque GLB model', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(500)

    const modelState = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const model = scene?.getObjectByName('logo-glb-model')
      const transform = scene?.getObjectByName('logo-glb-transform')
      if (!model || !transform) {
        return null
      }

      const materials: {
        depthTest: boolean
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
            opacity: number
            transparent: boolean
          }
          materials.push({
            depthTest: material.depthTest,
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
    expect(modelState?.frontAspect).toBeGreaterThan(20)
    expect(modelState?.transformScaleY).toBeGreaterThan(0)
    expect(modelState?.materialCount).toBeGreaterThan(0)
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

    const rotation = await page.evaluate(async () => {
      let peakRotation = 0

      for (let frame = 0; frame < 24; frame += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        const root =
          window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-rotating-root')
        const currentRotation = root
          ? Math.abs(root.quaternion.x) +
            Math.abs(root.quaternion.y) +
            Math.abs(root.quaternion.z)
          : 0
        peakRotation = Math.max(peakRotation, currentRotation)
      }

      return peakRotation
    })

    await page.close()
    expect(rotation).toBeGreaterThan(0.05)
  }, 30_000)

  it('removes logo motion effects when reduced motion is requested', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 10_000 })
    await page.waitForTimeout(500)

    const state = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const root = scene?.getObjectByName('logo-rotating-root')
      return {
        rays: Boolean(scene?.getObjectByName('logo-god-rays')),
        rotation: root
          ? Math.abs(root.quaternion.x) +
              Math.abs(root.quaternion.y) +
              Math.abs(root.quaternion.z)
          : 0,
      }
    })

    await page.close()
    expect(state.rays).toBe(false)
    expect(state.rotation).toBeLessThan(0.01)
  }, 30_000)

  it('opens and closes the mobile navigation menu', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const logo = page.locator('.logo-canvas-shell')
    await logo.waitFor({ state: 'visible', timeout: 10_000 })
    expect(await logo.getAttribute('data-logo-quality')).toBe('low')
    expect(await logo.getAttribute('data-rendering')).toBe('active')
    await page.waitForFunction(
      () => Boolean(window.__EOTO_LOGO_SCENE__?.getObjectByName('logo-god-rays')),
      undefined,
      { timeout: 10_000 },
    )
    const mobileBounds = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section')
      const logo = document.querySelector('.logo-canvas-shell')
      const statement = document.querySelector('.hero-statement')
      if (!hero || !logo || !statement) {
        throw new Error('Mobile hero bounds unavailable')
      }

      const heroBounds = hero.getBoundingClientRect()
      const logoBounds = logo.getBoundingClientRect()
      const statementBounds = statement.getBoundingClientRect()

      return {
        hero: {
          left: heroBounds.left,
          right: heroBounds.right,
        },
        innerWidth: window.innerWidth,
        logo: {
          left: logoBounds.left,
          right: logoBounds.right,
        },
        scrollWidth: document.documentElement.scrollWidth,
        statement: {
          left: statementBounds.left,
          right: statementBounds.right,
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
    expect(mobileBounds.statement.left).toBeGreaterThanOrEqual(
      mobileBounds.hero.left - 1,
    )
    expect(mobileBounds.statement.right).toBeLessThanOrEqual(
      mobileBounds.hero.right + 1,
    )
    const rayBudget = await page.evaluate(() => {
      const scene = window.__EOTO_LOGO_SCENE__
      const rays = scene?.getObjectByName('logo-god-rays')
      const vertexCount =
        rays && 'geometry' in rays
          ? (
              rays.geometry as {
                attributes: { position?: { count: number } }
              }
            ).attributes.position?.count ?? 0
          : 0

      return {
        haze: Boolean(scene?.getObjectByName('logo-god-ray-haze')),
        vertexCount,
      }
    })
    expect(rayBudget.haze).toBe(false)
    expect(rayBudget.vertexCount).toBeLessThan(500)

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
