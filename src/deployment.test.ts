import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const productionUrl = 'https://echoesoftheorion.com/'

describe('custom-domain deployment', () => {
  it('builds assets for the custom-domain root', async () => {
    const config = await readFile('vite.config.ts', 'utf8')

    expect(config).toContain("base: '/'")
    expect(config).not.toContain('/EotoWebsie/')
  })

  it('publishes canonical and social metadata for the production domain', async () => {
    const html = await readFile('index.html', 'utf8')

    expect(html).toContain(`<link rel="canonical" href="${productionUrl}" />`)
    expect(html).toContain(`<meta property="og:url" content="${productionUrl}" />`)
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
  })

  it('exposes search-engine discovery files on the same domain', async () => {
    const [robots, sitemap] = await Promise.all([
      readFile('public/robots.txt', 'utf8'),
      readFile('public/sitemap.xml', 'utf8'),
    ])

    expect(robots).toContain(`${productionUrl}sitemap.xml`)
    expect(sitemap).toContain(`<loc>${productionUrl}</loc>`)
  })
})
