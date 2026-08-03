import { ArrowUpRight, AudioLines, Youtube } from 'lucide-react'
import type { Release } from '../content/siteContent'

type FeaturedReleaseProps = {
  release: Release
}

export function FeaturedRelease({ release }: FeaturedReleaseProps) {
  return (
    <section
      aria-labelledby="everyday-title"
      className="featured-release"
      id="everyday"
    >
      <div className="featured-release-artwork">
        <img
          alt={release.artwork.alt}
          loading={release.artwork.priority ? 'eager' : 'lazy'}
          src={release.artwork.src}
        />
      </div>

      <div className="featured-release-content">
        <span className="section-index">FEATURED RELEASE</span>
        <h2 id="everyday-title">{release.title}</h2>
        <p className="featured-release-meta">
          {release.version} / {release.year}
        </p>

        <div className="featured-release-story">
          {release.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="featured-release-actions">
          <a href={release.youtubeUrl} rel="noreferrer" target="_blank">
            <Youtube aria-hidden="true" size={20} />
            Watch visualizer
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
          <a href={release.spotifyUrl} rel="noreferrer" target="_blank">
            <AudioLines aria-hidden="true" size={20} />
            Listen on Spotify
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
