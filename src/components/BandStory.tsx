import type { SiteContent } from '../content/siteContent'

type BandStoryProps = {
  identity: SiteContent['identity']
  members: SiteContent['members']
  story: SiteContent['story']
}

export function BandStory({ identity, members, story }: BandStoryProps) {
  const facts = [
    ['Formed', identity.formed],
    ['Based', identity.location],
    ['Style', identity.genre],
    ['Releases', `${identity.releasedSongCount} songs`],
    ['Current work', identity.currentWork],
  ]

  return (
    <section aria-labelledby="story-title" className="band-story" id="story">
      <div className="band-story-overview">
        <div className="band-story-copy">
          <span className="section-index">STORY</span>
          <h2 id="story-title">Story</h2>
          {story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <dl className="band-story-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div aria-labelledby="lineup-title" className="band-lineup">
        <h3 id="lineup-title">Lineup</h3>
        <ul>
          {members.map((member) => (
            <li key={member.name}>
              <span className="band-member-identity">
                <span className="band-member-name">{member.name}</span>
                {member.alias ? (
                  <span className="band-member-alias"> / {member.alias}</span>
                ) : null}
              </span>
              <span className="band-member-roles">
                {member.roles.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
