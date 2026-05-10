import EventCard from './EventCard.jsx'

/**
 * @param {{
 *   events: object[],
 *   loading: boolean,
 *   error: string | null,
 *   savedIds: Set<string>,
 *   onOpenEvent: (id: string) => void,
 *   onToggleSave: (id: string) => void,
 *   onEditEvent: (id: string) => void,
 *   onDeleteEvent: (id: string) => void,
 * }} props
 */
export default function MyEventsView({ events, loading, error, savedIds, onOpenEvent, onToggleSave, onEditEvent, onDeleteEvent }) {
  return (
    <div id="view-my-events" className="view-panel">
      <section className="saved-panel" aria-labelledby="my-events-title">
        <div className="saved-panel__sync" id="my-events-sync-hint" hidden={!loading} role="status">
          <span className="loading-spinner loading-spinner--sm loading-spinner--accent" aria-hidden="true" />
          <span>Loading your published events…</span>
        </div>
        <h2 id="my-events-title" className="saved-panel__title">
          My published events
        </h2>
        <p className="saved-panel__empty" id="my-events-empty-msg" hidden={events.length > 0 || loading} role="status">
          {error || 'You have not posted any events yet. Use Add Event to create one.'}
        </p>
        <ul className="events__list" id="my-events-list">
          {loading
            ? null
            : events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  isSaved={savedIds.has(ev.id)}
                  hideSave
                  onEdit={() => onEditEvent(ev.id)}
                  onDelete={() => onDeleteEvent(ev.id)}
                  onOpen={() => onOpenEvent(ev.id)}
                  onToggleSave={() => onToggleSave(ev.id)}
                />
              ))}
        </ul>
      </section>
    </div>
  )
}
