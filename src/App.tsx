import { Suspense, lazy, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Menu,
  Music2,
  Play,
  X,
  Youtube,
} from 'lucide-react'
import './App.css'
import { formatShowDateParts, siteContent } from './content/siteContent'

const LogoExperience = lazy(() =>
  import('./components/LogoExperience').then((module) => ({
    default: module.LogoExperience,
  })),
)

const navigation = [
  { href: '#shows', label: 'Shows' },
  { href: '#watch', label: 'Watch' },
  { href: '#band', label: 'Band' },
  { href: '#connect', label: 'Connect' },
]

function SocialIcon({ kind }: { kind: string }) {
  return kind === 'YouTube' ? (
    <Youtube aria-hidden="true" size={18} strokeWidth={1.7} />
  ) : (
    <Music2 aria-hidden="true" size={18} strokeWidth={1.7} />
  )
}

function App() {
  const { hero, videos, about, gallery, links, footer } = siteContent
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <a className="site-brand" href="#top" onClick={closeMenu}>
            <span className="brand-monogram" aria-hidden="true">EOTO</span>
            <span className="brand-name">Echoes Of The Orion</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className={`site-navigation ${menuOpen ? 'site-navigation-open' : ''}`}
            id="primary-navigation"
          >
            {navigation.map((item) => (
              <a href={item.href} key={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>

          <button
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero-section" id="top">
          <div className="hero-copy">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            {hero.quote ? <p className="hero-statement">{hero.quote}</p> : null}
            <p className="hero-intro">{hero.intro}</p>

            <div aria-labelledby="shows-title" className="shows-block" id="shows">
              <div className="shows-heading">
                <div>
                  <span className="section-index">Live</span>
                  <h2 id="shows-title">Upcoming concerts</h2>
                </div>
                <CalendarDays aria-hidden="true" size={21} strokeWidth={1.5} />
              </div>

              {hero.shows.length > 0 ? (
                <ul className="shows-list">
                  {hero.shows.map((show) => {
                    const showDate = formatShowDateParts(show)
                    const rawDate = show.date ?? show.dateLabel

                    return (
                      <li className="show-row" key={`${rawDate}-${show.venue}-${show.city}`}>
                        <div className="show-date">
                          <span className="show-day">{showDate.day}</span>
                          <span className="show-date-label">{showDate.label || rawDate}</span>
                        </div>

                        <div className="show-meta">
                          <p>{show.venue}</p>
                          <span>{show.city}</span>
                        </div>

                        {show.ticketUrl ? (
                          <a href={show.ticketUrl} target="_blank" rel="noreferrer">
                            Tickets
                            <ArrowUpRight aria-hidden="true" size={16} />
                          </a>
                        ) : (
                          <span className="show-status">{show.status ?? 'Details soon'}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="empty-state">
                  <div>
                    <p>No dates announced.</p>
                    <span>New live dates will appear here first.</span>
                  </div>
                  <a href="#watch">
                    Watch while you wait
                    <ArrowDownRight aria-hidden="true" size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="hero-logo-pane">
            <Suspense
              fallback={
                <div className="logo-fallback-shell">
                  <img
                    alt="Echoes Of The Orion logo"
                    className="logo-fallback-image"
                    src={`${import.meta.env.BASE_URL}assets/logo/logo-fallback.svg`}
                  />
                </div>
              }
            >
              <LogoExperience
                alt="Echoes Of The Orion logo"
                fallbackSrc={`${import.meta.env.BASE_URL}assets/logo/logo-fallback.svg`}
              />
            </Suspense>
          </div>
        </section>

        <section className="content-band watch-section" id="watch">
          <div className="section-heading">
            <span className="section-index">01</span>
            <h2>Watch</h2>
          </div>

          <a
            aria-label={`Watch ${videos.featured.title}`}
            className="featured-watch"
            href={videos.featured.url}
            rel="noreferrer"
            target="_blank"
          >
            <img alt={videos.featured.imageAlt} src={videos.featured.image} />
            <span className="featured-watch-shade" aria-hidden="true" />
            <span className="featured-watch-content">
              <span className="play-control">
                <Play aria-hidden="true" fill="currentColor" size={20} />
              </span>
              <span>
                <small>{videos.featured.kicker}</small>
                <strong>{videos.featured.title}</strong>
                <span>{videos.featured.description}</span>
              </span>
              <ArrowUpRight aria-hidden="true" className="featured-watch-arrow" />
            </span>
          </a>

          <div className="platform-links" aria-label="Streaming links">
            {videos.links.map((video) => (
              <a
                className="platform-link"
                href={video.url}
                key={`${video.kind}-${video.title}`}
                rel="noreferrer"
                target="_blank"
              >
                <SocialIcon kind={video.kind} />
                <span>
                  <small>{video.kind}</small>
                  <strong>{video.title}</strong>
                </span>
                <ArrowUpRight aria-hidden="true" size={18} />
              </a>
            ))}
          </div>
        </section>

        <section className="content-band band-section" id="band">
          <div className="section-heading">
            <span className="section-index">02</span>
            <h2>Band</h2>
          </div>

          <div className="about-layout">
            <div className="about-title">
              <p className="section-kicker">{about.kicker}</p>
              <h3>{about.title}</h3>
            </div>

            <div className="about-copy">
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="content-band gallery-section" id="visuals">
          <div className="section-heading">
            <span className="section-index">03</span>
            <h2>Visuals</h2>
          </div>

          <div className="gallery-grid">
            {gallery.map((photo, index) => (
              <figure
                className={`gallery-item gallery-item-${index + 1}`}
                key={photo.src}
              >
                <img alt={photo.alt} loading={photo.priority ? 'eager' : 'lazy'} src={photo.src} />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer className="site-footer" id="connect">
          <div className="footer-copy">
            <p className="section-kicker">{footer.kicker}</p>
            <h2>{footer.title}</h2>
            <p>{footer.note}</p>
          </div>

          <div className="footer-links">
            {links.map((link) => (
              <a href={link.url} key={link.label} rel="noreferrer" target="_blank">
                <SocialIcon kind={link.label} />
                <span>{link.label}</span>
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            ))}
          </div>

          <a className="back-to-top" href="#top">
            Back to top
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </footer>
      </main>
    </div>
  )
}

export default App
