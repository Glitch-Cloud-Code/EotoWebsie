declare const isoDateBrand: unique symbol

export type IsoDate = string & {
  readonly [isoDateBrand]: true
}

type ShowDetails = {
  city: string
  status?: string
  ticketUrl?: string
  venue: string
}

type ScheduledShow = ShowDetails & {
  date: IsoDate
  dateLabel?: never
}

type LabelledShow = ShowDetails & {
  date?: never
  dateLabel: string
}

export type Show = ScheduledShow | LabelledShow

export type ShowDateParts = {
  day: string
  label: string
}

export type VideoLink = {
  kind: string
  title: string
  url: string
}

export type PhotoAsset = {
  alt: string
  priority?: boolean
  src: string
}

export type SiteContent = {
  about: {
    kicker: string
    paragraphs: string[]
    title: string
  }
  footer: {
    kicker: string
    title: string
  }
  gallery: PhotoAsset[]
  hero: {
    eyebrow: string
    intro: string
    quote?: string
    shows: Show[]
    title: string
  }
  links: {
    label: string
    url: string
  }[]
  videos: {
    featured: {
      description: string
      kicker: string
      title: string
      url: string
    }
    links: VideoLink[]
  }
}

const base = import.meta.env.BASE_URL

const showDayFormatter = new Intl.DateTimeFormat('en', {
  day: '2-digit',
  timeZone: 'UTC',
})
const showLabelFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

export function createIsoDate(value: string): IsoDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    throw new Error(`Invalid ISO show date: ${value}`)
  }

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ISO show date: ${value}`)
  }

  return value as IsoDate
}

function hasScheduledDate(show: Show): show is ScheduledShow {
  return show.date !== undefined
}

export function formatShowDateParts(show: Show): ShowDateParts {
  if (!hasScheduledDate(show)) {
    return {
      day: show.dateLabel,
      label: '',
    }
  }

  const parsed = new Date(`${show.date}T00:00:00Z`)

  return {
    day: showDayFormatter.format(parsed),
    label: showLabelFormatter.format(parsed).toUpperCase(),
  }
}

export const siteContent: SiteContent = {
  hero: {
    eyebrow: 'Melodic metal from Latvia',
    title: 'Echoes Of The Orion',
    quote: '"Never being bored has a terrible price."',
    intro:
      'Heavy, melodic, and built for rooms that want atmosphere before impact. This page keeps the signal clean: where to catch the band, where to watch, and where the orbit goes next.',
    shows: [],
  },
  videos: {
    featured: {
      kicker: 'Featured watch',
      title: 'Official channel',
      description:
        'Releases, live cuts, and whatever rises next from the set. The channel is the first stop for the moving picture side of the band.',
      url: 'https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t',
    },
    links: [
      {
        kind: 'YouTube',
        title: 'Echoes Of The Orion',
        url: 'https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t',
      },
      {
        kind: 'Spotify',
        title: 'Stream the singles',
        url: 'https://open.spotify.com/artist/17SgjLYI26IGVmkxAAr9cS',
      },
    ],
  },
  about: {
    kicker: 'Profile',
    title: 'Melody with pressure behind it.',
    paragraphs: [
      'Echoes Of The Orion leans into contrast: weight and lift, sharp edges and open space, motion and restraint. The sound stays rooted in metal while leaving room for melody to steer the emotional line.',
      'The site follows the same logic. Minimal copy, strong atmosphere, and a front page that puts the logo and the next live move in immediate view.',
    ],
  },
  gallery: [
    {
      alt: 'Three-dimensional Echoes Of The Orion logo mockup',
      priority: true,
      src: `${base}assets/gallery/logo-mockup.jpg`,
    },
    {
      alt: 'Echoes Of The Orion logo detail artwork',
      src: `${base}assets/gallery/logo-detail.jpg`,
    },
    {
      alt: 'Illustrated falling figure artwork',
      src: `${base}assets/gallery/everyday-full.png`,
    },
    {
      alt: 'Illustrated portrait artwork',
      src: `${base}assets/gallery/everyday-man.png`,
    },
  ],
  links: [
    {
      label: 'YouTube',
      url: 'https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t',
    },
    {
      label: 'Spotify',
      url: 'https://open.spotify.com/artist/17SgjLYI26IGVmkxAAr9cS',
    },
  ],
  footer: {
    kicker: 'Connect',
    title: 'Booking, releases, and the next signal.',
  },
}
