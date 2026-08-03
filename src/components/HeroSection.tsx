import { Suspense, lazy } from 'react'
import { ArrowUpRight, Music2, Youtube } from 'lucide-react'
import type {
  Booking,
  PlatformLink,
  Show,
} from '../content/siteContent'
import { ShowsPanel } from './ShowsPanel'

const LogoExperience = lazy(() =>
  import('./LogoExperience').then((module) => ({
    default: module.LogoExperience,
  })),
)

type HeroSectionProps = {
  bandName: string
  booking: Booking
  platforms: PlatformLink[]
  shows: Show[]
}

export function HeroSection({
  bandName,
  booking,
  platforms,
  shows,
}: HeroSectionProps) {
  const musicPlatforms = platforms.filter(
    ({ kind }) => kind === 'youtube' || kind === 'spotify',
  )

  return (
    <section className="hero-section" id="top">
      <h1 className="visually-hidden">{bandName}</h1>

      <div className="hero-main">
        <ShowsPanel booking={booking} shows={shows} />

        <div className="hero-logo-pane">
          <Suspense
            fallback={
              <div className="logo-fallback-shell">
                <img
                  alt={`${bandName} logo`}
                  className="logo-fallback-image"
                  src={`${import.meta.env.BASE_URL}assets/logo/logo-fallback.svg`}
                />
              </div>
            }
          >
            <LogoExperience
              alt={`${bandName} logo`}
              fallbackSrc={`${import.meta.env.BASE_URL}assets/logo/logo-fallback.svg`}
            />
          </Suspense>
        </div>
      </div>

      <nav aria-label="Listen and watch" className="hero-platform-links">
        {musicPlatforms.map((platform) => (
          <a
            className={`hero-platform-link hero-platform-link-${platform.kind}`}
            href={platform.url}
            key={platform.kind}
            rel="noreferrer"
            target="_blank"
          >
            {platform.kind === 'youtube' ? (
              <Youtube aria-hidden="true" size={21} strokeWidth={1.7} />
            ) : (
              <Music2 aria-hidden="true" size={21} strokeWidth={1.7} />
            )}
            <span>
              {platform.kind === 'youtube'
                ? 'Watch on YouTube'
                : 'Listen on Spotify'}
            </span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>
        ))}
      </nav>
    </section>
  )
}
