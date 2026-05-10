import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEvents } from '../api/events.js'

const PAGE_SIZE = 5

/**
 * @param {object[]} list
 * @param {string} query
 */
function filterEventsLocal(list, query) {
  const qq = query.trim().toLowerCase()
  if (!qq) return list
  return list.filter((e) => {
    const blob = `${e.title} ${e.dateLabel} ${e.location} ${e.category} ${e.description}`.toLowerCase()
    return blob.includes(qq)
  })
}

/**
 * Browse / search / load-more state for the home events list (DA219B: structured list + pagination).
 * @returns {{
 *   events: object[],
 *   allEvents: object[],
 *   eventsLoading: boolean,
 *   eventsError: string | null,
 *   loadMoreBusy: boolean,
 *   browseHasMore: boolean,
 *   searchHasMore: boolean,
 *   searchInput: string,
 *   setSearchInput: (v: string) => void,
 *   loadInitialBrowse: () => Promise<void>,
 *   loadEvents: () => Promise<void>,
 *   loadMoreEvents: () => Promise<void>,
 *   silentRefreshBrowse: () => Promise<void>,
 * }}
 */
export function useBrowseEvents() {
  const [browseLoaded, setBrowseLoaded] = useState([])
  const [browseHasMore, setBrowseHasMore] = useState(false)
  const [searchLoaded, setSearchLoaded] = useState([])
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [events, setEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState(/** @type {string | null} */ (null))
  const [loadMoreBusy, setLoadMoreBusy] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const browseLoadedLenRef = useRef(0)
  useEffect(() => {
    browseLoadedLenRef.current = browseLoaded.length
  }, [browseLoaded.length])

  const searchAbortRef = useRef(/** @type {AbortController | null} */ (null))
  const searchDebounceRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  const searchRequestIdRef = useRef(0)

  const rebuildAllEvents = useCallback((browse, search) => {
    const m = new Map()
    for (const e of browse) m.set(e.id, e)
    for (const e of search) m.set(e.id, e)
    setAllEvents([...m.values()])
  }, [])

  const applyBrowseBranch = useCallback(
    (browse, hasMore, q) => {
      setBrowseLoaded(browse)
      setBrowseHasMore(hasMore)
      if (!q.trim()) {
        setSearchLoaded([])
        setSearchHasMore(false)
        setEvents(browse)
        rebuildAllEvents(browse, [])
      }
    },
    [rebuildAllEvents],
  )

  /** First paint: always load browse page only (stable for useEffect deps). */
  const loadInitialBrowse = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const browsePage = await fetchEvents({ limit: PAGE_SIZE, skip: 0 })
      setBrowseLoaded(browsePage.items)
      setBrowseHasMore(browsePage.hasMore)
      setSearchLoaded([])
      setSearchHasMore(false)
      setEvents(browsePage.items)
      rebuildAllEvents(browsePage.items, [])
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setEventsLoading(false)
    }
  }, [rebuildAllEvents])

  /** Full reload respecting current search box (e.g. after create/delete). */
  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const browsePage = await fetchEvents({ limit: PAGE_SIZE, skip: 0 })
      const q = searchInput.trim()
      if (q) {
        const searchPage = await fetchEvents({ q, limit: PAGE_SIZE, skip: 0 })
        setSearchLoaded(searchPage.items)
        setSearchHasMore(searchPage.hasMore)
        setBrowseLoaded(browsePage.items)
        setBrowseHasMore(browsePage.hasMore)
        setEvents(searchPage.items)
        rebuildAllEvents(browsePage.items, searchPage.items)
      } else {
        setSearchLoaded([])
        setSearchHasMore(false)
        setBrowseLoaded(browsePage.items)
        setBrowseHasMore(browsePage.hasMore)
        setEvents(browsePage.items)
        rebuildAllEvents(browsePage.items, [])
      }
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setEventsLoading(false)
    }
  }, [rebuildAllEvents, searchInput])

  const silentRefreshBrowse = useCallback(async () => {
    const q = searchInput.trim()
    if (q) return
    try {
      const limit = Math.max(PAGE_SIZE, browseLoadedLenRef.current || PAGE_SIZE)
      const browsePage = await fetchEvents({ limit, skip: 0 })
      applyBrowseBranch(browsePage.items, browsePage.hasMore, '')
    } catch {
      /* keep existing list on silent failure */
    }
  }, [applyBrowseBranch, searchInput])

  const runBrowseSearchQuery = useCallback(async () => {
    const q = searchInput.trim()
    if (!q) {
      searchRequestIdRef.current += 1
      setSearchLoaded([])
      setSearchHasMore(false)
      setEvents(browseLoaded)
      rebuildAllEvents(browseLoaded, [])
      return
    }
    const rid = ++searchRequestIdRef.current
    searchAbortRef.current?.abort()
    const ac = new AbortController()
    searchAbortRef.current = ac
    try {
      const page = await fetchEvents({ q, limit: PAGE_SIZE, skip: 0, signal: ac.signal })
      if (rid !== searchRequestIdRef.current) return
      setSearchLoaded(page.items)
      setSearchHasMore(page.hasMore)
      setEvents(page.items)
      setEventsError(null)
      rebuildAllEvents(browseLoaded, page.items)
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
      if (rid !== searchRequestIdRef.current) return
      if (browseLoaded.length > 0 && searchInput.trim()) {
        setEvents(filterEventsLocal(browseLoaded, searchInput))
        setEventsError(null)
      } else {
        setEventsError(err instanceof Error ? err.message : 'Search failed')
      }
    }
  }, [browseLoaded, rebuildAllEvents, searchInput])

  const onSearchInputChange = useCallback(
    (value) => {
      setSearchInput(value)
      const q = value.trim()
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      if (!q) {
        searchAbortRef.current?.abort()
        searchRequestIdRef.current += 1
        setSearchLoaded([])
        setSearchHasMore(false)
        setEvents(browseLoaded)
        rebuildAllEvents(browseLoaded, [])
        return
      }
      if (browseLoaded.length > 0) {
        setEvents(filterEventsLocal(browseLoaded, value))
      }
      searchDebounceRef.current = setTimeout(() => {
        searchDebounceRef.current = null
        void runBrowseSearchQuery()
      }, 220)
    },
    [browseLoaded, rebuildAllEvents, runBrowseSearchQuery],
  )

  const loadMoreEvents = useCallback(async () => {
    if (loadMoreBusy || eventsLoading) return
    const q = searchInput.trim()
    setLoadMoreBusy(true)
    try {
      if (q) {
        const page = await fetchEvents({ q, limit: PAGE_SIZE, skip: searchLoaded.length })
        const merged = [...searchLoaded, ...page.items]
        setSearchLoaded(merged)
        setSearchHasMore(page.hasMore)
        setEvents(merged)
        rebuildAllEvents(browseLoaded, merged)
      } else {
        const page = await fetchEvents({ limit: PAGE_SIZE, skip: browseLoaded.length })
        const merged = [...browseLoaded, ...page.items]
        setBrowseLoaded(merged)
        setBrowseHasMore(page.hasMore)
        setEvents(merged)
        rebuildAllEvents(merged, searchLoaded)
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not load more')
    } finally {
      setLoadMoreBusy(false)
    }
  }, [
    browseLoaded,
    eventsLoading,
    loadMoreBusy,
    rebuildAllEvents,
    searchInput,
    searchLoaded,
  ])

  return {
    events,
    /** Union of browse + search buffers for detail / saved fallbacks */
    allEvents,
    eventsLoading,
    eventsError,
    loadMoreBusy,
    browseHasMore,
    searchHasMore,
    searchInput,
    setSearchInput: onSearchInputChange,
    loadInitialBrowse,
    loadEvents,
    loadMoreEvents,
    silentRefreshBrowse,
  }
}
