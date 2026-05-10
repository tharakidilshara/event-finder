import EventCard from './EventCard.jsx'

/**
 * @param {{
 *   events: object[],
 *   loading: boolean,
 *   error: string | null,
 *   savedIds: Set<string>,
 *   onOpenEvent: (id: string) => void,
 *   onToggleSave: (id: string) => void,
 * }} props
 */
export default function SavedView({ events, loading, error, savedIds, onOpenEvent, onToggleSave }) {
  return (
    <div id="view-saved" className="view-panel">
      <section className="saved-panel" aria-labelledby="saved-title">
        <div className="saved-panel__sync" id="saved-sync-hint" hidden={!loading} role="status">
          <span className="loading-spinner loading-spinner--sm loading-spinner--accent" aria-hidden="true" />
          <span>Refreshing saved list…</span>
        </div>
        <h2 id="saved-title" className="saved-panel__title">
          Saved events
        </h2>
        <p className="saved-panel__lede">Events you bookmarked from the list (stored in your account).</p>
        <p className="saved-panel__empty" id="saved-empty-msg" hidden={events.length > 0 || loading} role="status">
          {error || 'No saved events yet. Open Home, find an event in the list, then tap the bookmark on a card.'}
        </p>
        <ul className="events__list" id="saved-events-list">
          {loading
            ? null
            : events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  isSaved={savedIds.has(ev.id)}
                  onOpen={() => onOpenEvent(ev.id)}
                  onToggleSave={() => onToggleSave(ev.id)}
                />
              ))}
        </ul>
      </section>
    </div>
  )
}
