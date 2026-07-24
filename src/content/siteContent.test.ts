import { describe, expect, it } from 'vitest'
import {
  createIsoDate,
  formatShowDateParts,
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
