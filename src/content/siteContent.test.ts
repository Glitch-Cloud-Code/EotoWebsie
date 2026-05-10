import { describe, expect, it } from 'vitest'
import { formatShowDateParts, type Show } from './siteContent'

describe('site content helpers', () => {
  it('derives show day and label from one ISO date field', () => {
    const show: Show = {
      city: 'Riga, LV',
      date: '2026-08-24',
      venue: 'Melna Piektdiena',
    }

    expect(formatShowDateParts(show.date)).toEqual({
      day: '24',
      label: 'AUG 2026',
    })
  })

  it('keeps custom date labels displayable when date is not ISO', () => {
    expect(formatShowDateParts('TBA')).toEqual({
      day: 'TBA',
      label: '',
    })
  })
})
