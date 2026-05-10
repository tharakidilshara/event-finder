import EventCard from './EventCard.jsx'

/** @param {{ count?: number }} props */
function EventSkeletonList({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="event-card event-card--skeleton" aria-hidden="true">
          <div className="event-card__body">
            <div className="event-card__meta">
              <span className="event-card__skeleton-chip" />
              <span className="event-card__skeleton-chip event-card__skeleton-chip--sm" />
            </div>
            <div className="event-card__skeleton-line event-card__skeleton-line--lg" />
            <div className="event-card__skeleton-line event-card__skeleton-line--md" />
            <div className="event-card__skeleton-line event-card__skeleton-line--md" />
            <div className="event-card__skeleton-line event-card__skeleton-line--sm" />
            <div className="event-card__skeleton-line event-card__skeleton-line--full" />
          </div>
          <div className="event-card__thumb-cell">
            <div className="event-card__thumb event-card__skeleton-thumb" />
          </div>
        </li>
      ))}
    </>
  )
}

/**
 * @param {{
 *   events: object[],
 *   savedIds: Set<string>,
 *   eventsLoading: boolean,
 *   eventsError: string | null,
 *   loadMoreBusy: boolean,
 *   hasMore: boolean,
 *   searchInput: string,
 *   onLoadMore: () => void,
 *   onOpenEvent: (id: string) => void,
 *   onToggleSave: (id: string) => void,
 * }} props
 */
export default function EventListSection({
  events,
  savedIds,
  eventsLoading,
  eventsError,
  loadMoreBusy,
  hasMore,
  searchInput,
  onLoadMore,
  onOpenEvent,
  onToggleSave,
}) {
  const busy = eventsLoading || loadMoreBusy

  return (
    <section className="events" id="mock-events-section" aria-labelledby="mock-events-title">
      <h2 id="mock-events-title" className="events__title">
        Upcoming events
      </h2>
      <div className="events__loading-rich" id="events-loading-block" hidden={!eventsLoading && !loadMoreBusy} role="status" aria-live="polite">
        <div className="events__loading-head">
          <span className="loading-spinner loading-spinner--accent" aria-hidden="true" />
          <span className="events__loading-label">{loadMoreBusy ? 'Loading more…' : 'Loading events…'}</span>
        </div>
        <p className="events__loading-hint">
          {loadMoreBusy ? 'Fetching additional events.' : 'Hang tight while we fetch the latest listings.'}
        </p>
      </div>
      <p className={`events__empty ${eventsError ? 'events__empty--error' : ''}`} id="events-empty-msg" hidden={events.length > 0 && !eventsError} role="status">
        {eventsError ||
          (searchInput.trim()
            ? 'No events match your search.'
            : 'No events yet. Add one from the menu or seed your database.')}
      </p>
      <ul className="events__list" id="mock-events-list">
        {eventsLoading ? (
          <EventSkeletonList count={4} />
        ) : (
          events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isSaved={savedIds.has(ev.id)}
              onOpen={() => onOpenEvent(ev.id)}
              onToggleSave={() => onToggleSave(ev.id)}
            />
          ))
        )}
      </ul>
      <div className="events__load-more-wrap">
        <button type="button" className="btn btn--ghost events__load-more" id="events-load-more-btn" hidden={!hasMore} disabled={busy} onClick={() => onLoadMore()}>
          {loadMoreBusy ? 'Loading…' : 'Load more'}
        </button>
      </div>
    </section>
  )
}
