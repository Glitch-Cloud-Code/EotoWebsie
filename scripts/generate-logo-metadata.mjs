import { writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const outputPath = new URL('../src/assets/logoMetadata.json', import.meta.url)
const server = await createServer({
  configFile: 'vite.config.ts',
  logLevel: 'silent',
  server: {
    host: '127.0.0.1',
    port: 0,
  },
})

let browser

try {
  await server.listen()
  const localUrl = server.resolvedUrls?.local[0]
  if (!localUrl) {
    throw new Error('Vite did not expose a local URL')
  }

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const baseUrl = new URL('/EotoWebsie/', localUrl)
  await page.goto(baseUrl.toString())

  const metadata = await page.evaluate(async ({ basePath }) => {
    const module = await import(`${basePath}scripts/logoMetadataBrowser.ts`)
    return module.generateLogoMetadata(`${basePath}assets/logo/logo-fallback.svg`)
  }, { basePath: baseUrl.pathname })

  await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
} finally {
  await browser?.close()
  await server.close()
}
