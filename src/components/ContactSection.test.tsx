import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { siteContent } from '../content/siteContent'
import { ContactSection } from './ContactSection'

describe('ContactSection', () => {
  const { contact, identity, platforms } = siteContent
  const markup = renderToStaticMarkup(
    <ContactSection
      bandName={identity.name}
      contact={contact}
      platforms={platforms}
    />,
  )

  it('renders the corrected email as visible text and a mail link', () => {
    expect(contact.email).toBe('echoesoftheorionband@gmail.com')
    expect(markup).toContain(`href="mailto:${contact.email}"`)
    expect(markup).toContain(`>${contact.email}</a>`)
  })

  it('renders each required social destination exactly once', () => {
    const requiredKinds = ['instagram', 'facebook', 'youtube', 'spotify']

    expect(platforms.map(({ kind }) => kind).sort()).toEqual(
      [...requiredKinds].sort(),
    )

    for (const platform of platforms) {
      const escapedUrl = platform.url.replaceAll('&', '&amp;')
      expect(markup.split(`href="${escapedUrl}"`)).toHaveLength(2)
      expect(markup.split(`>${platform.label}</span>`)).toHaveLength(2)
    }
  })

  it('opens external links with safe attributes', () => {
    expect(markup.match(/target="_blank"/g)).toHaveLength(4)
    expect(markup.match(/rel="noreferrer noopener"/g)).toHaveLength(4)
  })

  it('does not render Linktree', () => {
    expect(markup.toLowerCase()).not.toContain('linktr.ee')
    expect(markup.toLowerCase()).not.toContain('linktree')
  })

  it('provides the contact landmark, heading, social navigation, and top link', () => {
    expect(markup).toContain('<footer aria-labelledby="contact-title"')
    expect(markup).toContain('id="contact"')
    expect(markup).toContain('<h2 id="contact-title">Get in touch</h2>')
    expect(markup).toContain('<nav aria-label="Echoes Of The Orion social links"')
    expect(markup).toContain('href="#top"')
    expect(markup).toContain('Back to top')
  })
})
