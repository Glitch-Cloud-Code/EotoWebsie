import { Suspense, lazy } from 'react'
import './App.css'
import { siteContent } from './content/siteContent'

const LogoExperience = lazy(() =>
  import('./components/LogoExperience').then((module) => ({
    default: module.LogoExperience,
  })),
)

function App() {
  const { hero, videos, about, gallery, links, footer } = siteContent

  return (
    <div className="site-shell">
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            {hero.quote ? <p className="hero-quote">{hero.quote}</p> : null}
            <p className="hero-intro">{hero.intro}</p>

            <div className="shows-block">
              <div className="section-heading">
                <span />
                <h2>Upcoming concerts</h2>
              </div>

              {hero.shows.length > 0 ? (
                <ul className="shows-list">
                  {hero.shows.map((show) => (
                    <li className="show-row" key={`${show.date}-${show.venue}-${show.city}`}>
                      <div className="show-date">
                        <span className="show-day">{show.day}</span>
                        <span className="show-date-label">{show.date}</span>
                      </div>

                      <div className="show-meta">
                        <p>{show.venue}</p>
                        <span>{show.city}</span>
                      </div>

                      {show.ticketUrl ? (
                        <a href={show.ticketUrl} target="_blank" rel="noreferrer">
                          Tickets
                        </a>
                      ) : (
                        <span className="show-status">{show.status ?? 'Details soon'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>No dates announced yet.</p>
                  <span>Booking and routing updates land here first.</span>
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

        <section className="content-band content-band-video" id="video">
          <div className="section-heading">
            <span />
            <h2>Video</h2>
          </div>

          <div className="video-grid">
            <article className="featured-video">
              <p className="section-kicker">{videos.featured.kicker}</p>
              <h3>{videos.featured.title}</h3>
              <p>{videos.featured.description}</p>
              {videos.featured.url ? (
                <a href={videos.featured.url} target="_blank" rel="noreferrer">
                  Watch now
                </a>
              ) : (
                <span className="inline-note">Video link landing soon.</span>
              )}
            </article>

            <div className="video-links">
              {videos.links.map((video) => (
                <a
                  className="video-link"
                  href={video.url}
                  key={`${video.kind}-${video.title}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{video.kind}</span>
                  <strong>{video.title}</strong>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="content-band" id="about">
          <div className="section-heading">
            <span />
            <h2>Band</h2>
          </div>

          <div className="about-layout">
            <div>
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

        <section className="content-band" id="gallery">
          <div className="section-heading">
            <span />
            <h2>Visuals</h2>
          </div>

          <div className="gallery-grid">
            {gallery.map((photo) => (
              <figure
                className={`gallery-card ${photo.priority ? 'gallery-card-priority' : ''}`}
                key={photo.src}
              >
                <img alt={photo.alt} loading={photo.priority ? 'eager' : 'lazy'} src={photo.src} />
              </figure>
            ))}
          </div>
        </section>

        <footer className="content-band site-footer">
          <div>
            <p className="section-kicker">{footer.kicker}</p>
            <h2>{footer.title}</h2>
          </div>

          <div className="footer-links">
            {links.map((link) => (
              <a href={link.url} key={link.label} rel="noreferrer" target="_blank">
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
