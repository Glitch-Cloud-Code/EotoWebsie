import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import './App.css'
import { siteContent } from './content/siteContent'
import { BandStory } from './components/BandStory'
import { ContactSection } from './components/ContactSection'
import { FeaturedRelease } from './components/FeaturedRelease'
import { HeroSection } from './components/HeroSection'
import { PhotoGallery } from './components/PhotoGallery'

const navigation = [
  { href: '#top', label: 'Shows' },
  { href: '#everyday', label: 'Everyday' },
  { href: '#story', label: 'Story' },
  { href: '#photos', label: 'Photos' },
  { href: '#contact', label: 'Contact' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
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

        <PhotoGallery photos={siteContent.gallery} />

        <ContactSection
          bandName={siteContent.identity.name}
          contact={siteContent.contact}
          platforms={siteContent.platforms}
        />
      </main>
    </div>
  )
}

export default App
