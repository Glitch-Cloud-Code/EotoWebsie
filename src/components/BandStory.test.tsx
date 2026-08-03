import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { siteContent } from '../content/siteContent'
import { BandStory } from './BandStory'

describe('BandStory', () => {
  const { identity, members, story } = siteContent
  const markup = renderToStaticMarkup(
    <BandStory identity={identity} members={members} story={story} />,
  )

  it('renders the story section and all three factual paragraphs', () => {
    expect(markup).toContain('id="story"')
    expect(markup).toContain('<h2 id="story-title">Story</h2>')
    expect(story).toHaveLength(3)

    for (const paragraph of story) {
      expect(markup).toContain(`<p>${paragraph}</p>`)
    }
  })

  it('renders band facts as a semantic definition list', () => {
    expect(markup).toContain('<dl class="band-story-facts">')
    expect(markup).toContain('<dt>Formed</dt>')
    expect(markup).toContain(`<dd>${identity.formed}</dd>`)
    expect(markup).toContain('<dt>Based</dt>')
    expect(markup).toContain(`<dd>${identity.location}</dd>`)
    expect(markup).toContain('<dt>Style</dt>')
    expect(markup).toContain(`<dd>${identity.genre}</dd>`)
    expect(markup).toContain('<dt>Releases</dt>')
    expect(markup).toContain(`<dd>${identity.releasedSongCount} songs</dd>`)
    expect(markup).toContain('<dt>Current work</dt>')
    expect(markup).toContain(`<dd>${identity.currentWork}</dd>`)
  })

  it('renders five unique members in a semantic lineup list', () => {
    expect(members).toHaveLength(5)
    expect(new Set(members.map(({ name }) => name)).size).toBe(5)
    expect(markup).toContain('<ul>')
    expect(markup.match(/<li>/g)).toHaveLength(5)

    for (const member of members) {
      expect(markup).toContain(`>${member.name}</span>`)
      expect(markup).toContain(`>${member.roles.join(', ')}</span>`)
    }
  })

  it('presents the member alias separately from the member name', () => {
    expect(markup).toContain(' / Glitch Cloud')
    expect(markup).not.toContain('Sergey Smirnov Glitch Cloud')
  })

  it('does not restore vague slogans or explain the band name', () => {
    expect(markup).not.toContain('heavy melody, sharp edges')
    expect(markup).not.toContain('follow the next signal')
    expect(markup).not.toContain('From Riga to the stage')
    expect(markup.toLowerCase()).not.toContain('name means')
  })
})
