import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createIsoDate,
  siteContent,
  type Show,
} from '../content/siteContent'
import { ShowsPanel } from './ShowsPanel'

describe('ShowsPanel', () => {
  it('renders the announced DEPO concert and Lastadija festival', () => {
    const markup = renderToStaticMarkup(
      <ShowsPanel booking={siteContent.booking} shows={siteContent.shows} />,
    )

    expect(markup).toContain('28')
    expect(markup).toContain('AUG 2026')
    expect(markup).toContain('DEPO')
    expect(markup).toContain('20:30')
    expect(markup).toContain('href="https://www.facebook.com/klubsDEPO/"')
    expect(markup).toContain('Šarlotes iela 18A, Riga, LV-1001, Latvia')
    expect(markup).toContain('19')
    expect(markup).toContain('SEP 2026')
    expect(markup).toContain('Lastadija')
    expect(markup).toContain('Shockwave Fest')
    expect(markup).toContain('href="https://www.facebook.com/lastadija/"')
    expect(markup).toContain('Kārļa Mīlenbaha iela 11')
    expect(markup).not.toContain('NO DATES ANNOUNCED')
  })

  it('renders the booking invitation when no shows are announced', () => {
    const markup = renderToStaticMarkup(
      <ShowsPanel booking={siteContent.booking} shows={[]} />,
    )

    expect(markup).toContain('NO DATES ANNOUNCED')
    expect(markup).toContain('Want us on your stage?')
    expect(markup).toContain('We are looking for new live opportunities.')
    expect(markup).toContain('Invite us to play')
    expect(markup).toContain(
      'href="mailto:echoesoftheorionband@gmail.com?subject=Live%20invitation%20for%20Echoes%20Of%20The%20Orion"',
    )
  })

  it('renders a ticket link for a ticketed show', () => {
    const shows: Show[] = [
      {
        city: 'Riga, Latvia',
        date: createIsoDate('2026-10-18'),
        ticketUrl: 'https://example.com/tickets',
        venue: 'Melna Piektdiena',
      },
    ]
    const markup = renderToStaticMarkup(
      <ShowsPanel booking={siteContent.booking} shows={shows} />,
    )

    expect(markup).toContain('18')
    expect(markup).toContain('OCT 2026')
    expect(markup).toContain('Melna Piektdiena')
    expect(markup).toContain('Riga, Latvia')
    expect(markup).toContain('href="https://example.com/tickets"')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noreferrer"')
    expect(markup).toContain('Tickets')
  })

  it('renders a labelled date and status without a ticket link', () => {
    const shows: Show[] = [
      {
        city: 'Riga, Latvia',
        dateLabel: 'TBA',
        status: 'Registration soon',
        venue: 'Venue to be announced',
      },
    ]
    const markup = renderToStaticMarkup(
      <ShowsPanel booking={siteContent.booking} shows={shows} />,
    )

    expect(markup).toContain('TBA')
    expect(markup).toContain('Registration soon')
    expect(markup).not.toContain('Tickets')
  })
})
