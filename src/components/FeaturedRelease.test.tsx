import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { siteContent } from '../content/siteContent'
import { FeaturedRelease } from './FeaturedRelease'

describe('FeaturedRelease', () => {
  const release = siteContent.featuredRelease
  const markup = renderToStaticMarkup(<FeaturedRelease release={release} />)

  it('renders the release identity and exact factual story', () => {
    expect(markup).toContain('id="everyday"')
    expect(markup).toContain('FEATURED RELEASE')
    expect(markup).toContain('<h2 id="everyday-title">Everyday</h2>')
    expect(markup).toContain('Radio Edit / 2025')

    for (const paragraph of release.story) {
      expect(markup).toContain(`<p>${paragraph}</p>`)
    }
  })

  it('renders uncropped artwork content with useful alternative text', () => {
    expect(markup).toContain('class="featured-release-artwork"')
    expect(markup).toContain(`src="${release.artwork.src}"`)
    expect(markup).toContain(`alt="${release.artwork.alt}"`)
  })

  it('links directly to the release on YouTube and Spotify', () => {
    expect(markup).toContain(`href="${release.youtubeUrl}"`)
    expect(markup).toContain(`href="${release.spotifyUrl}"`)
    expect(markup).toContain('Watch visualizer')
    expect(markup).toContain('Listen on Spotify')
    expect(markup.match(/target="_blank"/g)).toHaveLength(2)
    expect(markup.match(/rel="noreferrer"/g)).toHaveLength(2)
  })

  it('does not load an embedded player', () => {
    expect(markup).not.toContain('<iframe')
    expect(markup).not.toContain('<embed')
    expect(markup).not.toContain('<video')
  })
})
