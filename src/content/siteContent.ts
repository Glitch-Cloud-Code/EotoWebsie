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

export type PlatformKind =
  | 'youtube'
  | 'spotify'
  | 'instagram'
  | 'facebook'
  | 'email'

export type PlatformLink = {
  kind: PlatformKind
  label: string
  url: string
}

export type PhotoAsset = {
  alt: string
  caption?: string
  priority?: boolean
  src: string
}

export type Booking = {
  email: string
  invitation: string
  mailtoUrl: string
  subject: string
}

export type Release = {
  artwork: PhotoAsset
  spotifyUrl: string
  story: string[]
  title: string
  version: string
  year: number
  youtubeUrl: string
}

export type Member = {
  alias?: string
  name: string
  roles: string[]
}

export type SiteContent = {
  identity: {
    currentWork: string
    formed: string
    genre: string
    location: string
    name: string
    purpose: string
    releasedSongCount: number
  }
  shows: Show[]
  booking: Booking
  platforms: PlatformLink[]
  featuredRelease: Release
  story: string[]
  members: Member[]
  gallery: PhotoAsset[]
  contact: {
    email: string
    statement: string
  }

  // Temporary projections keep the current page working while sections migrate.
  hero: {
    eyebrow: string
    intro: string
    quote?: string
    shows: Show[]
    title: string
  }
  videos: {
    featured: {
      description: string
      image: string
      imageAlt: string
      kicker: string
      title: string
      url: string
    }
    links: {
      kind: string
      title: string
      url: string
    }[]
  }
  about: {
    kicker: string
    paragraphs: string[]
    title: string
  }
  links: {
    label: string
    url: string
  }[]
  footer: {
    kicker: string
    note: string
    title: string
  }
}

const base = import.meta.env.BASE_URL
const email = 'echoesoftheorionband@gmail.com'
const bookingSubject = 'Live invitation for Echoes Of The Orion'

const shows: Show[] = []

const platforms: PlatformLink[] = [
  {
    kind: 'youtube',
    label: 'YouTube',
    url: 'https://youtube.com/@echoesoftheorion?si=PHvCrsPm1_OZV35t',
  },
  {
    kind: 'spotify',
    label: 'Spotify',
    url: 'https://open.spotify.com/artist/17SgjLYI26IGVmkxAAr9cS',
  },
  {
    kind: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/echoesoftheorion/',
  },
  {
    kind: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61575317535170',
  },
]

const gallery: PhotoAsset[] = [
  {
    alt: 'Echoes Of The Orion performing together on a dark club stage',
    priority: true,
    src: `${base}assets/photos/band-live-wide.jpg`,
  },
  {
    alt: 'Echoes Of The Orion vocalist singing under red stage light',
    src: `${base}assets/photos/band-vocalist.jpg`,
  },
  {
    alt: 'Echoes Of The Orion bassist playing a white bass on stage',
    src: `${base}assets/photos/band-bassist.jpg`,
  },
]

const story = [
  'Echoes Of The Orion formed in Riga in March 2023 to learn together, create original music, and play it on stage.',
  'The band plays Melodic Alt Metal and has released three songs. Everyday is its most polished release so far.',
  'The band is working on a full album release and looking for new opportunities to perform live.',
]

const featuredRelease: Release = {
  artwork: {
    alt: 'Everyday single artwork showing a falling figure in blue and pink light',
    src: `${base}assets/gallery/everyday-full.png`,
  },
  spotifyUrl: 'https://open.spotify.com/track/3vx6sgOJQL4aalFRwB6Mt7',
  story: [
    'The band won a vocal competition with Everyday at ANTEX Recording Studio.',
    'The prize gave the band an opportunity to record a song there, which the band used to record and release Everyday.',
  ],
  title: 'Everyday',
  version: 'Radio Edit',
  year: 2025,
  youtubeUrl: 'https://www.youtube.com/watch?v=wwzwPSeAk7I',
}

const members: Member[] = [
  {
    name: 'Alexander Gutarov',
    roles: ['Composer', 'Lead/Rhythm guitar'],
  },
  {
    alias: 'Glitch Cloud',
    name: 'Sergey Smirnov',
    roles: ['Vocal', 'Lyrics'],
  },
  {
    name: 'Dmitry Anokhin',
    roles: ['Bass'],
  },
  {
    name: 'Ilya Rogov',
    roles: ['Drums'],
  },
  {
    name: 'Igor Maestro',
    roles: ['2nd Guitar'],
  },
]

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
  identity: {
    currentWork: 'Full album release',
    formed: 'March 2023',
    genre: 'Melodic Alt Metal',
    location: 'Riga, Latvia',
    name: 'Echoes Of The Orion',
    purpose: 'Learn together, create original music, and play it on stage.',
    releasedSongCount: 3,
  },
  shows,
  booking: {
    email,
    invitation: 'Want us on your stage? Invite us to play.',
    mailtoUrl: `mailto:${email}?subject=${encodeURIComponent(bookingSubject)}`,
    subject: bookingSubject,
  },
  platforms,
  featuredRelease,
  story,
  members,
  gallery,
  contact: {
    email,
    statement: 'Live invitations, collaboration, and general enquiries.',
  },
  hero: {
    eyebrow: 'Melodic Alt Metal · Riga, Latvia',
    intro: 'Working on a full album release and looking for live opportunities.',
    shows,
    title: 'Echoes Of The Orion',
  },
  videos: {
    featured: {
      description: featuredRelease.story.join(' '),
      image: featuredRelease.artwork.src,
      imageAlt: featuredRelease.artwork.alt,
      kicker: 'Featured release · 2025',
      title: 'Everyday (Radio Edit)',
      url: featuredRelease.youtubeUrl,
    },
    links: platforms
      .filter(({ kind }) => kind === 'youtube' || kind === 'spotify')
      .map(({ label, url }) => ({
        kind: label,
        title: label === 'YouTube' ? 'Watch the band' : 'Listen to the band',
        url,
      })),
  },
  about: {
    kicker: 'Story',
    paragraphs: story,
    title: 'From Riga to the stage.',
  },
  links: platforms.map(({ label, url }) => ({ label, url })),
  footer: {
    kicker: 'Contact',
    note: email,
    title: 'Live invitations, collaboration, and general enquiries.',
  },
}
