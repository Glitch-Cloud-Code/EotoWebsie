import bandLiveWideLarge from '../assets/photos/band-live-wide-large.webp'
import bandLiveWideSmall from '../assets/photos/band-live-wide-small.webp'
import bassistLarge from '../assets/photos/bassist-large.webp'
import bassistSmall from '../assets/photos/bassist-small.webp'
import drummerLarge from '../assets/photos/drummer-large.webp'
import drummerSmall from '../assets/photos/drummer-small.webp'
import guitaristDarkLarge from '../assets/photos/guitarist-dark-large.webp'
import guitaristDarkSmall from '../assets/photos/guitarist-dark-small.webp'
import guitaristLongHairLarge from '../assets/photos/guitarist-long-hair-large.webp'
import guitaristLongHairSmall from '../assets/photos/guitarist-long-hair-small.webp'
import vocalistLarge from '../assets/photos/vocalist-large.webp'
import vocalistSmall from '../assets/photos/vocalist-small.webp'

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

export type GalleryPhotoAsset = PhotoAsset & {
  height: number
  id: string
  layout: 'portrait' | 'wide'
  srcSet: string
  width: number
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
  gallery: GalleryPhotoAsset[]
  contact: {
    email: string
    statement: string
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

const gallery: GalleryPhotoAsset[] = [
  {
    alt: 'Five musicians performing together under warm amber stage lights',
    height: 700,
    id: 'full-band',
    layout: 'wide',
    src: bandLiveWideLarge,
    srcSet: `${bandLiveWideSmall} 960w, ${bandLiveWideLarge} 1600w`,
    width: 1600,
  },
  {
    alt: 'Vocalist singing into a handheld microphone under red and blue lights',
    height: 1000,
    id: 'vocalist',
    layout: 'portrait',
    src: vocalistLarge,
    srcSet: `${vocalistSmall} 480w, ${vocalistLarge} 800w`,
    width: 800,
  },
  {
    alt: 'Bassist playing a white five-string bass on stage',
    height: 1000,
    id: 'bassist',
    layout: 'portrait',
    src: bassistLarge,
    srcSet: `${bassistSmall} 480w, ${bassistLarge} 800w`,
    width: 800,
  },
  {
    alt: 'Dark-haired guitarist playing a black electric guitar during a live performance',
    height: 1000,
    id: 'guitarist-dark',
    layout: 'portrait',
    src: guitaristDarkLarge,
    srcSet: `${guitaristDarkSmall} 480w, ${guitaristDarkLarge} 800w`,
    width: 800,
  },
  {
    alt: 'Long-haired guitarist playing under red stage lighting',
    height: 1000,
    id: 'guitarist-long-hair',
    layout: 'portrait',
    src: guitaristLongHairLarge,
    srcSet: `${guitaristLongHairSmall} 480w, ${guitaristLongHairLarge} 800w`,
    width: 800,
  },
  {
    alt: 'Drummer playing behind cymbals in bright blue-white backlighting',
    height: 810,
    id: 'drummer',
    layout: 'wide',
    src: drummerLarge,
    srcSet: `${drummerSmall} 900w, ${drummerLarge} 1440w`,
    width: 1440,
  },
]

const story = [
  'Echoes Of The Orion came together in Riga in March 2023, drawn by a shared desire to learn, create original music, and bring it to the stage.',
  'Since then, we have released three songs and begun shaping a Melodic Alt Metal sound of our own. Everyday is our most polished release yet.',
  'We are now pouring that momentum into a full album while looking for new stages where we can bring these songs to life.',
]

const featuredRelease: Release = {
  artwork: {
    alt: 'Everyday single artwork showing a falling figure in blue and pink light',
    src: `${base}assets/releases/everyday.webp`,
  },
  spotifyUrl: 'https://open.spotify.com/track/3vx6sgOJQL4aalFRwB6Mt7',
  story: [
    'Everyday opened a new chapter for us when it won a vocal competition at ANTEX Recording Studio.',
    'The prize was a recording session, giving us the chance to shape the song into the release you hear today.',
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
}
