import { readdir, readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  createIsoDate,
  formatShowDateParts,
  siteContent,
  type Show,
} from './siteContent'

describe('site content helpers', () => {
  it('derives show day and label from one ISO date field', () => {
    const show: Show = {
      city: 'Riga, LV',
      date: createIsoDate('2026-08-24'),
      venue: 'Melna Piektdiena',
    }

    expect(formatShowDateParts(show)).toEqual({
      day: '24',
      label: 'AUG 2026',
    })
  })

  it('keeps custom date labels explicit and displayable', () => {
    const show: Show = {
      city: 'Riga, LV',
      dateLabel: 'TBA',
      venue: 'Venue to be announced',
    }

    expect(formatShowDateParts(show)).toEqual({
      day: 'TBA',
      label: '',
    })
  })

  it('accepts valid leap dates', () => {
    expect(createIsoDate('2028-02-29')).toBe('2028-02-29')
  })

  it.each(['2026-02-29', '2026-13-01', '24 Aug 2026', 'TBA'])(
    'rejects invalid ISO date %s',
    (value) => {
      expect(() => createIsoDate(value)).toThrow(`Invalid ISO show date: ${value}`)
    },
  )
})

describe('factual site content', () => {
  it('uses the corrected contact email everywhere', () => {
    expect(siteContent.contact.email).toBe('echoesoftheorionband@gmail.com')
    expect(siteContent.booking.email).toBe(siteContent.contact.email)
    expect(siteContent.booking.mailtoUrl).toContain(siteContent.contact.email)
  })

  it('keeps contact and platform data in canonical fields', () => {
    expect(siteContent).not.toHaveProperty('links')
    expect(siteContent).not.toHaveProperty('footer')
    expect(siteContent.platforms).toHaveLength(4)
  })

  it('builds an encoded booking email action', () => {
    expect(siteContent.booking.subject).toBe(
      'Live invitation for Echoes Of The Orion',
    )
    expect(siteContent.booking.mailtoUrl).toBe(
      'mailto:echoesoftheorionband@gmail.com?subject=Live%20invitation%20for%20Echoes%20Of%20The%20Orion',
    )
  })

  it('uses supplied release and general platform URLs', () => {
    expect(siteContent.featuredRelease.youtubeUrl).toBe(
      'https://www.youtube.com/watch?v=wwzwPSeAk7I',
    )
    expect(siteContent.featuredRelease.spotifyUrl).toBe(
      'https://open.spotify.com/track/3vx6sgOJQL4aalFRwB6Mt7',
    )
    expect(siteContent.platforms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'youtube',
          url: 'https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t',
        }),
        expect.objectContaining({
          kind: 'spotify',
          url: 'https://open.spotify.com/artist/17SgjLYI26IGVmkxAAr9cS',
        }),
      ]),
    )

    for (const link of siteContent.platforms) {
      expect(new URL(link.url).protocol).toBe('https:')
    }
  })

  it('records the supplied identity and release facts', () => {
    expect(siteContent.identity).toMatchObject({
      currentWork: 'Full album release',
      formed: 'March 2023',
      genre: 'Melodic Alt Metal',
      location: 'Riga, Latvia',
      name: 'Echoes Of The Orion',
      releasedSongCount: 3,
    })
    expect(siteContent.featuredRelease).toMatchObject({
      artwork: {
        src: `${import.meta.env.BASE_URL}assets/releases/everyday.webp`,
      },
      title: 'Everyday',
      version: 'Radio Edit',
      year: 2025,
    })
    expect(siteContent.featuredRelease.story.join(' ')).toContain(
      'Everyday opened a new chapter for us when it won a vocal competition at ANTEX Recording Studio.',
    )
  })

  it('uses the optimized Everyday WebP runtime asset', async () => {
    const asset = await readFile('public/assets/releases/everyday.webp')

    expect(asset.length).toBeGreaterThan(100_000)
    expect(asset.length).toBeLessThan(500_000)
    expect(asset.subarray(0, 4).toString('ascii')).toBe('RIFF')
    expect(asset.subarray(8, 12).toString('ascii')).toBe('WEBP')
  })

  it('defines six distinct responsive gallery photos', () => {
    expect(siteContent.gallery).toHaveLength(6)
    expect(new Set(siteContent.gallery.map(({ id }) => id)).size).toBe(6)
    expect(new Set(siteContent.gallery.map(({ src }) => src)).size).toBe(6)
    expect(
      siteContent.gallery.filter(({ layout }) => layout === 'wide'),
    ).toHaveLength(2)
    expect(
      siteContent.gallery.filter(({ layout }) => layout === 'portrait'),
    ).toHaveLength(4)
    expect(siteContent.gallery.every(({ caption }) => caption === undefined)).toBe(
      true,
    )
    expect(
      siteContent.gallery.every(
        ({ alt, height, srcSet, width }) =>
          alt.length > 20 && height > 0 && srcSet.includes('w, ') && width > 0,
      ),
    ).toBe(true)
  })

  it('keeps responsive gallery WebP assets within the transfer budget', async () => {
    const filenames = (await readdir('src/assets/photos')).filter((filename) =>
      filename.endsWith('.webp'),
    )
    const assets = await Promise.all(
      filenames.map((filename) => readFile(`src/assets/photos/${filename}`)),
    )

    expect(filenames).toHaveLength(12)
    expect(assets.every((asset) => asset.length < 220_000)).toBe(true)
    expect(
      assets.every(
        (asset) =>
          asset.subarray(0, 4).toString('ascii') === 'RIFF' &&
          asset.subarray(8, 12).toString('ascii') === 'WEBP',
      ),
    ).toBe(true)
  })

  it('lists each supplied member once with the supplied roles', () => {
    expect(siteContent.members).toEqual([
      {
        name: 'Alexander Gutarov',
        roles: ['Composer', 'Lead/Rhythm guitar'],
      },
      {
        alias: 'Glitch Cloud',
        name: 'Sergey Smirnov',
        roles: ['Vocal', 'Lyrics'],
      },
      { name: 'Dmitry Anokhin', roles: ['Bass'] },
      { name: 'Ilya Rogov', roles: ['Drums'] },
      { name: 'Igor Maestro', roles: ['2nd Guitar'] },
    ])
    expect(new Set(siteContent.members.map(({ name }) => name)).size).toBe(5)
  })

  it('omits the lyric, name meaning, and old placeholder copy', () => {
    const serialized = JSON.stringify(siteContent).toLowerCase()

    expect(serialized).not.toContain('never being bored')
    expect(serialized).not.toContain('heavy melody, sharp edges')
    expect(serialized).not.toContain('follow the next signal')
    expect(serialized).not.toContain('first full-length')
    expect(serialized).not.toContain('name means')
  })
})
