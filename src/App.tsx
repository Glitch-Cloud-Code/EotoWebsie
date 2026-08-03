import { useState } from 'react'
import {
  ArrowUpRight,
  Menu,
  Music2,
  X,
  Youtube,
} from 'lucide-react'
import './App.css'
import { siteContent } from './content/siteContent'
import { BandStory } from './components/BandStory'
import { FeaturedRelease } from './components/FeaturedRelease'
import { HeroSection } from './components/HeroSection'
import { PhotoGallery } from './components/PhotoGallery'

const navigation = [
  { href: '#shows', label: 'Shows' },
  { href: '#everyday', label: 'Everyday' },
  { href: '#story', label: 'Story' },
  { href: '#photos', label: 'Photos' },
  { href: '#connect', label: 'Contact' },
]

function SocialIcon({ kind }: { kind: string }) {
  return kind === 'YouTube' ? (
    <Youtube aria-hidden="true" size={18} strokeWidth={1.7} />
  ) : (
    <Music2 aria-hidden="true" size={18} strokeWidth={1.7} />
  )
}

function App() {
  const { gallery, links, footer } = siteContent
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
            <span className="visually-hidden">Echoes Of The Orion</span>
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
        <HeroSection
          bandName={siteContent.identity.name}
          booking={siteContent.booking}
          platforms={siteContent.platforms}
          shows={siteContent.shows}
        />

        <FeaturedRelease release={siteContent.featuredRelease} />

        <BandStory
          identity={siteContent.identity}
          members={siteContent.members}
          story={siteContent.story}
        />

        <PhotoGallery photos={gallery} />

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
