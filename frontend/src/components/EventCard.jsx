function BookmarkIcon({ filled }) {
  if (filled) {
    return (
      <svg className="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    )
  }
  return (
    <svg className="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

/** @param {{ event: object, isSaved: boolean, onOpen: () => void, onToggleSave: (e: { stopPropagation: () => void }) => void }} props */
export default function EventCard({ event, isSaved, onOpen, onToggleSave }) {
  const priceLabel = event.isFree ? 'Free' : `$${Number(event.price) > 0 ? event.price : 0}`

  return (
    <li
      className="event-card"
      role="button"
      tabIndex={0}
      data-action="open-event"
      data-event-id={event.id}
      aria-label={`View details for ${event.title}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="event-card__body">
        <div className="event-card__meta">
          <span className="event-card__category">{event.category}</span>
          <span className={`event-card__price ${event.isFree ? 'event-card__price--free' : 'event-card__price--paid'}`}>
            {priceLabel}
          </span>
        </div>
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__when">{event.dateLabel}</p>
        <p className="event-card__where">{event.location}</p>
        <p className="event-card__desc">{event.description}</p>
      </div>
      <div className="event-card__thumb-cell">
        {event.imageUrl ? (
          <img className="event-card__thumb" src={event.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="event-card__thumb event-card__thumb--placeholder" aria-hidden="true" />
        )}
      </div>
      <button
        type="button"
        className={`event-card__save ${isSaved ? 'event-card__save--saved' : ''}`}
        data-action="save-event"
        data-event-id={event.id}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove “${event.title}” from saved` : `Save “${event.title}”`}
        title={isSaved ? 'Remove from saved' : 'Save event'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSave(e)
        }}
      >
        <BookmarkIcon filled={isSaved} />
      </button>
    </li>
  )
}
