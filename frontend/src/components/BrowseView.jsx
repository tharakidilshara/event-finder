import { useEffect } from 'react'
import { useBrowseEvents } from '../hooks/useBrowseEvents.js'
import EventListSection from './EventListSection.jsx'

const REFRESH_MS = 45_000

/**
 * Home view: hero, search, event list, features; periodic browse refresh (DA219B).
 * @param {{
 *   savedIds: Set<string>,
 *   onOpenEvent: (id: string) => void,
 *   onToggleSave: (id: string) => void,
 *   onBrowseBufferChange?: (rows: object[]) => void,
 * }} props
 */
export default function BrowseView({ savedIds, onOpenEvent, onToggleSave, onBrowseBufferChange }) {
  const {
    events,
    eventsLoading,
    eventsError,
    loadMoreBusy,
    browseHasMore,
    searchHasMore,
    searchInput,
    setSearchInput,
    loadInitialBrowse,
    loadMoreEvents,
    loadEvents,
    silentRefreshBrowse,
    allEvents,
  } = useBrowseEvents()

  useEffect(() => {
    void loadInitialBrowse()
  }, [loadInitialBrowse])

  useEffect(() => {
    onBrowseBufferChange?.(allEvents)
  }, [allEvents, onBrowseBufferChange])

  useEffect(() => {
    const h = () => void loadEvents()
    window.addEventListener('ef:reload-events', h)
    return () => window.removeEventListener('ef:reload-events', h)
  }, [loadEvents])

  useEffect(() => {
    const id = window.setInterval(() => {
      void silentRefreshBrowse()
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [silentRefreshBrowse])

  const hasMore = searchInput.trim() ? searchHasMore : browseHasMore

  return (
    <div id="view-browse" className="view-panel">
      <section className="hero" aria-labelledby="hero-title">
        <p className="hero__eyebrow">Campus &amp; community</p>
        <h1 id="hero-title" className="hero__title">
          Find events that fit your week
        </h1>
        <p className="hero__lede">
          Browse what is on nearby, filter by what matters to you, then save a spot or register in one place.
        </p>
        <div className="hero__search search">
          <div className="search__control">
            <svg className="search__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              className="search__input"
              id="event-search"
              name="event-search"
              placeholder="Try yoga, careers, hall…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search events"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={eventsLoading || loadMoreBusy}
              aria-busy={eventsLoading || loadMoreBusy ? 'true' : 'false'}
            />
          </div>
        </div>
      </section>

      <EventListSection
        events={events}
        savedIds={savedIds}
        eventsLoading={eventsLoading}
        eventsError={eventsError}
        loadMoreBusy={loadMoreBusy}
        hasMore={hasMore}
        searchInput={searchInput}
        onLoadMore={() => void loadMoreEvents()}
        onOpenEvent={onOpenEvent}
        onToggleSave={onToggleSave}
      />

      <section className="features" aria-labelledby="features-title">
        <h2 id="features-title" className="features__heading">
          What you can do
        </h2>
        <ul className="feature-grid">
          <li className="feature-card">
            <h3 className="feature-card__title">Browse</h3>
            <p className="feature-card__text">Scan upcoming listings at a glance.</p>
          </li>
          <li className="feature-card">
            <h3 className="feature-card__title">Search &amp; filter</h3>
            <p className="feature-card__text">Narrow by date, topic, or location.</p>
          </li>
          <li className="feature-card">
            <h3 className="feature-card__title">Details</h3>
            <p className="feature-card__text">Open an event for time, venue, and notes.</p>
          </li>
          <li className="feature-card">
            <h3 className="feature-card__title">Save &amp; register</h3>
            <p className="feature-card__text">Keep favorites or sign up when you are ready.</p>
          </li>
        </ul>
      </section>
    </div>
  )
}
