import { ArrowUpRight, CalendarDays } from 'lucide-react'
import {
  formatShowDateParts,
  type Booking,
  type Show,
} from '../content/siteContent'

type ShowsPanelProps = {
  booking: Booking
  shows: Show[]
}

export function ShowsPanel({ booking, shows }: ShowsPanelProps) {
  return (
    <section aria-labelledby="shows-title" className="shows-block" id="shows">
      <div className="shows-heading">
        <div>
          <span className="section-index">LIVE</span>
          <h2 id="shows-title">Upcoming concerts</h2>
        </div>
        <CalendarDays aria-hidden="true" size={21} strokeWidth={1.5} />
      </div>

      {shows.length > 0 ? (
        <ul className="shows-list">
          {shows.map((show) => {
            const showDate = formatShowDateParts(show)
            const rawDate = show.date ?? show.dateLabel

            return (
              <li
                className="show-row"
                key={`${rawDate}-${show.venue}-${show.city}`}
              >
                <div className="show-date">
                  <span className="show-day">{showDate.day}</span>
                  <span className="show-date-label">
                    {showDate.label || rawDate}
                  </span>
                </div>

                <div className="show-meta">
                  <p>
                    {show.venueSocialUrl ? (
                      <a
                        aria-label={
                          show.venueAddress
                            ? `${show.venue} social page. Address: ${show.venueAddress}`
                            : `${show.venue} social page`
                        }
                        className="show-venue-link"
                        data-address={show.venueAddress}
                        href={show.venueSocialUrl}
                        rel="noreferrer"
                        target="_blank"
                        title={show.venueAddress}
                      >
                        {show.venue}
                        <ArrowUpRight aria-hidden="true" size={14} />
                      </a>
                    ) : (
                      show.venue
                    )}
                  </p>
                  <span>{show.city}</span>
                </div>

                {show.ticketUrl ? (
                  <a href={show.ticketUrl} rel="noreferrer" target="_blank">
                    Tickets
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </a>
                ) : (
                  <span className="show-status">
                    {show.status ?? 'Details soon'}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="empty-state-label">NO DATES ANNOUNCED</p>
          <div>
            <p>Want us on your stage?</p>
            <span>We are looking for new live opportunities.</span>
          </div>
          <a href={booking.mailtoUrl}>
            Invite us to play
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </div>
      )}
    </section>
  )
}
