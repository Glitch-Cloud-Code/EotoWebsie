import {
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Facebook,
  Instagram,
  Mail,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import type {
  PlatformKind,
  SiteContent,
} from '../content/siteContent'

type ContactSectionProps = {
  bandName: string
  contact: SiteContent['contact']
  platforms: SiteContent['platforms']
}

type SocialKind = PlatformKind

const socialOrder: SocialKind[] = [
  'instagram',
  'facebook',
  'youtube',
  'spotify',
]

const socialIcons: Record<SocialKind, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  spotify: AudioLines,
  youtube: Youtube,
}

export function ContactSection({
  bandName,
  contact,
  platforms,
}: ContactSectionProps) {
  const socialLinks = socialOrder.flatMap((kind) => {
    const platform = platforms.find((item) => item.kind === kind)
    return platform ? [platform] : []
  })

  return (
    <footer aria-labelledby="contact-title" className="contact-section" id="contact">
      <div className="contact-section-copy">
        <span className="section-index">CONTACT</span>
        <h2 id="contact-title">Get in touch</h2>
        <p>{contact.statement}</p>
        <a className="contact-email" href={`mailto:${contact.email}`}>
          <Mail aria-hidden="true" size={20} />
          {contact.email}
        </a>
      </div>

      <nav aria-label={`${bandName} social links`} className="contact-socials">
        {socialLinks.map((platform) => {
          const Icon = socialIcons[platform.kind]

          return (
            <a
              href={platform.url}
              key={platform.kind}
              rel="noreferrer noopener"
              target="_blank"
            >
              <Icon aria-hidden="true" size={20} />
              <span>{platform.label}</span>
              <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          )
        })}
      </nav>

      <div className="contact-section-footer">
        <p>{bandName}</p>
        <a href="#top">
          Back to top
          <ArrowUp aria-hidden="true" size={16} />
        </a>
      </div>
    </footer>
  )
}
