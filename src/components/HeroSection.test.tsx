import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { siteContent } from '../content/siteContent'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders one general link per music platform and a hidden identity heading', () => {
    const markup = renderToStaticMarkup(
      <HeroSection
        bandName={siteContent.identity.name}
        booking={siteContent.booking}
        platforms={siteContent.platforms}
        shows={siteContent.shows}
      />,
    )

    expect(markup.match(/Watch on YouTube/g)).toHaveLength(1)
    expect(markup.match(/Listen on Spotify/g)).toHaveLength(1)
    expect(markup).toContain(
      'href="https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t"',
    )
    expect(markup).toContain(
      'href="https://open.spotify.com/artist/17SgjLYI26IGVmkxAAr9cS"',
    )
    expect(markup).toContain(
      '<h1 class="visually-hidden">Echoes Of The Orion</h1>',
    )
    expect(markup).toContain(
      `${import.meta.env.BASE_URL}assets/logo/logo-fallback.svg`,
    )
    expect(markup).not.toContain('Never being bored')
  })
})
