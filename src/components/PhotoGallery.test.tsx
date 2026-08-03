import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { siteContent } from '../content/siteContent'
import { PhotoGallery } from './PhotoGallery'

describe('PhotoGallery', () => {
  const photos = siteContent.gallery
  const markup = renderToStaticMarkup(<PhotoGallery photos={photos} />)

  it('uses the curated six-photo layout', () => {
    expect(photos).toHaveLength(6)
    expect(photos.filter(({ layout }) => layout === 'portrait')).toHaveLength(4)
    expect(photos.filter(({ layout }) => layout === 'wide')).toHaveLength(2)
    expect(new Set(photos.map(({ id }) => id)).size).toBe(photos.length)
    expect(new Set(photos.map(({ src }) => src)).size).toBe(photos.length)
  })

  it('renders a labelled section and semantic list of figures', () => {
    expect(markup).toContain('id="photos"')
    expect(markup).toContain('aria-labelledby="photos-title"')
    expect(markup).toContain('<h2 id="photos-title">Photos</h2>')
    expect(markup.match(/<ul[ >]/g)).toHaveLength(1)
    expect(markup.match(/<li[ >]/g)).toHaveLength(photos.length)
    expect(markup.match(/<figure>/g)).toHaveLength(photos.length)
  })

  it('renders complete lazy image metadata', () => {
    for (const photo of photos) {
      expect(photo.alt.length).toBeGreaterThan(0)
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      expect(photo.srcSet).not.toBe('')
      expect(markup).toContain(`alt="${photo.alt}"`)
      expect(markup).toContain(`src="${photo.src}"`)
      expect(markup).toContain(`srcSet="${photo.srcSet}"`)
      expect(markup).toContain(`width="${photo.width}"`)
      expect(markup).toContain(`height="${photo.height}"`)
    }

    expect(markup.match(/loading="lazy"/g)).toHaveLength(photos.length)
    expect(markup.match(/decoding="async"/g)).toHaveLength(photos.length)
    expect(markup.match(/sizes="[^"]+"/g)).toHaveLength(photos.length)
    expect(markup).toContain('(max-width: 420px) calc(100vw - 2rem)')
    expect(markup).toContain('(max-width: 720px) calc((100vw - 3rem) / 2)')
  })

  it('derives classes from layout without index-based classes', () => {
    expect(markup.match(/photo-gallery-item--portrait/g)).toHaveLength(4)
    expect(markup.match(/photo-gallery-item--wide/g)).toHaveLength(2)
    expect(markup).not.toMatch(/photo-gallery-item--?\d/)
  })

  it('omits captions when content has none', () => {
    expect(photos.every(({ caption }) => caption === undefined)).toBe(true)
    expect(markup).not.toContain('<figcaption')
  })
})
