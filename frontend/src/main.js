import './style.css'
import { clearSession, fetchMe, getAccessToken, getStoredUser } from './api/auth.js'
import { createEvent, deleteEvent, fetchEventById, fetchEvents, patchEvent } from './api/events.js'
import { getAuthModalMarkup, initAuthModal, openAuthModal } from './components/authModal.js'
import { renderEventCards, renderEventSkeletons } from './components/eventCard.js'
import { getPostEventMarkup, initPostEventForm, setPostPanelBusy } from './components/postEvent.js'
import {
  closeEventDetail,
  getEventDetailMarkup,
  initEventDetail,
  openEventDetail,
  setEventDetailActionsDisabled,
  setEventDetailFetchLoading,
} from './components/eventDetail.js'
import {
  getRegisterTicketMarkup,
  initRegisterTicketModal,
  openRegisterTicketModal,
} from './components/registerTicket.js'

const savedEventIds = new Set()

const PAGE_SIZE = 5

/** Merged loaded rows (browse + search) for saved lookup and detail fallbacks. */
/** @type {Array<{ id: string, title: string, dateLabel: string, location: string, category: string, description: string, imageUrl?: string, isFree?: boolean, price?: number }>} */
let allEvents = []
/** Upcoming events loaded for browse (append with Load more). */
let browseLoaded = []
let browseHasMore = false
/** Server search results for current query (paged). */
let searchLoaded = []
let searchHasMore = false
/** Rows shown in the browse list (browse buffer or search buffer / local preview). */
let events = []
let eventsLoading = false
/** @type {string | null} */
let eventsError = null
let browseInitialLoadDone = false
let loadMoreBusy = false

/** @type {AbortController | null} */
let searchAbort = null
/** @type {ReturnType<typeof setTimeout> | null} */
let searchDebounceTimer = null
let searchRequestId = 0

/**
 * @param {typeof browseLoaded} list
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

function rebuildAllEvents() {
  const m = new Map()
  for (const e of browseLoaded) m.set(e.id, e)
  for (const e of searchLoaded) m.set(e.id, e)
  allEvents = [...m.values()]
}

async function loadEvents() {
  eventsLoading = true
  eventsError = null
  updateEventsView()
  try {
    const browsePage = await fetchEvents({ limit: PAGE_SIZE, skip: 0 })
    browseLoaded = browsePage.items
    browseHasMore = browsePage.hasMore
    const q = document.querySelector('#event-search')?.value.trim() ?? ''
    if (q) {
      const searchPage = await fetchEvents({ q, limit: PAGE_SIZE, skip: 0 })
      searchLoaded = searchPage.items
      searchHasMore = searchPage.hasMore
      events = searchLoaded
    } else {
      searchLoaded = []
      searchHasMore = false
      events = browseLoaded
    }
    rebuildAllEvents()
    eventsError = null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    eventsError = message
  } finally {
    browseInitialLoadDone = true
    eventsLoading = false
    updateEventsView()
    updateSavedView()
  }
}

async function loadMoreEvents() {
  if (loadMoreBusy || eventsLoading) return
  const searchInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#event-search'))
  const q = searchInput?.value.trim() ?? ''
  loadMoreBusy = true
  updateEventsView()
  try {
    if (q) {
      const page = await fetchEvents({ q, limit: PAGE_SIZE, skip: searchLoaded.length })
      searchLoaded = [...searchLoaded, ...page.items]
      searchHasMore = page.hasMore
      events = searchLoaded
    } else {
      const page = await fetchEvents({ limit: PAGE_SIZE, skip: browseLoaded.length })
      browseLoaded = [...browseLoaded, ...page.items]
      browseHasMore = page.hasMore
      events = browseLoaded
    }
    rebuildAllEvents()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load more'
    window.alert(message)
  } finally {
    loadMoreBusy = false
    updateEventsView()
    updateSavedView()
  }
}

function scheduleBrowseSearch() {
  const searchInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#event-search'))
  const q = searchInput?.value.trim() ?? ''
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!q) {
    searchAbort?.abort()
    searchRequestId += 1
    searchLoaded = []
    searchHasMore = false
    events = browseLoaded
    rebuildAllEvents()
    updateEventsView()
    return
  }
  if (browseLoaded.length > 0) {
    events = filterEventsLocal(browseLoaded, q)
    updateEventsView()
  }
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    void runBrowseSearchQuery()
  }, 220)
}

async function runBrowseSearchQuery() {
  const searchInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#event-search'))
  const q = searchInput?.value.trim() ?? ''
  if (!q) {
    searchRequestId += 1
    searchLoaded = []
    searchHasMore = false
    events = browseLoaded
    rebuildAllEvents()
    updateEventsView()
    return
  }
  const rid = ++searchRequestId
  searchAbort?.abort()
  const ac = new AbortController()
  searchAbort = ac
  try {
    const page = await fetchEvents({ q, limit: PAGE_SIZE, skip: 0, signal: ac.signal })
    if (rid !== searchRequestId) return
    searchLoaded = page.items
    searchHasMore = page.hasMore
    events = searchLoaded
    eventsError = null
    rebuildAllEvents()
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
    if (rid !== searchRequestId) return
    const latestQ = searchInput?.value.trim() ?? ''
    if (browseLoaded.length > 0 && latestQ) {
      events = filterEventsLocal(browseLoaded, latestQ)
      eventsError = null
    } else {
      const message = err instanceof Error ? err.message : 'Search failed'
      eventsError = message
    }
  }
  if (rid === searchRequestId) updateEventsView()
}

/**
 * @param {HTMLElement} loadingBlock
 * @param {'initial' | 'more'} mode
 */
function setBrowseLoadingCopy(loadingBlock, mode) {
  const loadingLabel = loadingBlock.querySelector('.events__loading-label')
  const loadingHint = loadingBlock.querySelector('.events__loading-hint')
  if (!loadingLabel || !loadingHint) return
  if (mode === 'more') {
    loadingLabel.textContent = 'Loading more…'
    loadingHint.textContent = 'Fetching additional events.'
  } else {
    loadingLabel.textContent = 'Loading events…'
    loadingHint.textContent = 'Hang tight while we fetch the latest listings.'
  }
}

function updateEventsView() {
  const searchInput = document.querySelector('#event-search')
  const eventsListEl = document.querySelector('#mock-events-list')
  const emptyMsg = document.querySelector('#events-empty-msg')
  const loadingBlock = document.querySelector('#events-loading-block')
  const loadMoreBtn = document.querySelector('#events-load-more-btn')
  if (!searchInput || !eventsListEl || !emptyMsg || !loadingBlock) return

  const busy = eventsLoading || loadMoreBusy
  searchInput.toggleAttribute('disabled', busy)
  searchInput.setAttribute('aria-busy', busy ? 'true' : 'false')

  if (eventsLoading) {
    loadingBlock.hidden = false
    setBrowseLoadingCopy(loadingBlock, 'initial')
    emptyMsg.classList.remove('events__empty--error')
    renderEventSkeletons(eventsListEl, 4)
    emptyMsg.hidden = true
    if (loadMoreBtn) {
      loadMoreBtn.hidden = true
      loadMoreBtn.disabled = true
    }
    return
  }

  if (eventsError) {
    loadingBlock.hidden = true
    setBrowseLoadingCopy(loadingBlock, 'initial')
    eventsListEl.replaceChildren()
    emptyMsg.textContent = eventsError
    emptyMsg.classList.add('events__empty--error')
    emptyMsg.hidden = false
    if (loadMoreBtn) {
      loadMoreBtn.hidden = true
      loadMoreBtn.disabled = true
    }
    return
  }

  if (loadMoreBusy) {
    loadingBlock.hidden = false
    setBrowseLoadingCopy(loadingBlock, 'more')
    emptyMsg.classList.remove('events__empty--error')
    renderEventCards(eventsListEl, events, savedEventIds)
    emptyMsg.hidden = true
    if (loadMoreBtn) {
      const hasQuery = searchInput.value.trim().length > 0
      const hasMore = hasQuery ? searchHasMore : browseHasMore
      loadMoreBtn.hidden = !hasMore
      loadMoreBtn.disabled = true
      loadMoreBtn.textContent = 'Loading…'
    }
    return
  }

  loadingBlock.hidden = true
  setBrowseLoadingCopy(loadingBlock, 'initial')
  emptyMsg.classList.remove('events__empty--error')

  renderEventCards(eventsListEl, events, savedEventIds)
  const hasQuery = searchInput.value.trim().length > 0
  emptyMsg.textContent = hasQuery
    ? 'No events match your search.'
    : browseLoaded.length === 0
      ? 'No events yet. Add one from the menu or seed your database.'
      : 'No events match your search.'
  emptyMsg.hidden = events.length > 0

  if (loadMoreBtn) {
    const hasMore = hasQuery ? searchHasMore : browseHasMore
    loadMoreBtn.hidden = !hasMore
    loadMoreBtn.disabled = loadMoreBusy
    loadMoreBtn.textContent = loadMoreBusy ? 'Loading…' : 'Load more'
  }
}

function getSavedEvents() {
  return allEvents.filter((e) => savedEventIds.has(e.id))
}

function updateSavedView() {
  const listEl = document.querySelector('#saved-events-list')
  const emptyMsg = document.querySelector('#saved-empty-msg')
  const syncHint = document.querySelector('#saved-sync-hint')
  if (!listEl || !emptyMsg) return
  if (syncHint) syncHint.hidden = !eventsLoading
  if (eventsLoading) {
    renderEventSkeletons(listEl, 3)
    emptyMsg.hidden = true
    return
  }
  const list = getSavedEvents()
  renderEventCards(listEl, list, savedEventIds)
  emptyMsg.hidden = list.length > 0
}

function setNavActive(view) {
  const home = document.querySelector('#nav-home')
  const savedBtn = document.querySelector('#nav-saved')
  const postBtn = document.querySelector('#nav-post')
  home?.classList.toggle('nav__link--active', view === 'browse')
  savedBtn?.classList.toggle('nav__link--active', view === 'saved')
  postBtn?.classList.toggle('nav__link--active', view === 'post')

  if (view === 'browse') {
    home?.setAttribute('aria-current', 'page')
    savedBtn?.removeAttribute('aria-current')
    postBtn?.removeAttribute('aria-current')
  } else if (view === 'saved') {
    savedBtn?.setAttribute('aria-current', 'page')
    home?.removeAttribute('aria-current')
    postBtn?.removeAttribute('aria-current')
  } else {
    home?.removeAttribute('aria-current')
    savedBtn?.removeAttribute('aria-current')
    postBtn?.setAttribute('aria-current', 'page')
  }
}

function refreshAuthNav() {
  const label = document.querySelector('#nav-user-label')
  const signOut = document.querySelector('#nav-signout')
  const u = getStoredUser()
  if (label && signOut) {
    if (u) {
      label.textContent = u.name || u.email
      label.hidden = false
      signOut.hidden = false
    } else {
      label.textContent = ''
      label.hidden = true
      signOut.hidden = true
    }
  }
}

/**
 * @param {object} event
 * @returns {boolean}
 */
function canManageEvent(event) {
  const user = getStoredUser()
  if (!user) return false
  const cid =
    event.creatorId ??
    (event.creator && typeof event.creator === 'object' && event.creator.id ? event.creator.id : null)
  if (!cid) return false
  return cid === user.id
}

function showView(view) {
  const browse = document.querySelector('#view-browse')
  const savedPanel = document.querySelector('#view-saved')
  const postPanel = document.querySelector('#view-post')
  if (!browse || !savedPanel || !postPanel) return
  const isBrowse = view === 'browse'
  const isSaved = view === 'saved'
  const isPost = view === 'post'

  browse.hidden = !isBrowse
  savedPanel.hidden = !isSaved
  postPanel.hidden = !isPost
  setNavActive(view)
  if (isBrowse) updateEventsView()
  if (isSaved) updateSavedView()
}

document.querySelector('#app').innerHTML = `
  <div class="page">
    <header class="header">
      <a class="logo" href="/" id="logo-home">HittaEvent</a>
      <nav class="nav" aria-label="Main">
        <button type="button" class="nav__link nav__link--active" id="nav-home" aria-current="page">Home</button>
        <button type="button" class="nav__link" id="nav-post">Add Event</button>
        <button type="button" class="nav__link" id="nav-saved">Saved</button>
        <span class="nav__user" id="nav-user-label" hidden></span>
        <button type="button" class="nav__link nav__link--subtle" id="nav-signout" hidden>Sign out</button>
      </nav>
    </header>

    <main class="main">
      <div id="view-browse" class="view-panel">
      <section class="hero" aria-labelledby="hero-title">
        <p class="hero__eyebrow">Campus &amp; community</p>
        <h1 id="hero-title" class="hero__title">Find events that fit your week</h1>
        <p class="hero__lede">
          Browse what is on nearby, filter by what matters to you, then save a spot or register in one place.
        </p>
        <div class="hero__search search">
          <div class="search__control">
            <svg
              class="search__icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              class="search__input"
              id="event-search"
              name="event-search"
              placeholder="Try yoga, careers, hall…"
              autocomplete="off"
              spellcheck="false"
              aria-label="Search events"
            />
          </div>
        </div>
      </section>

      <section class="events" id="mock-events-section" aria-labelledby="mock-events-title">
        <h2 id="mock-events-title" class="events__title">Upcoming events</h2>
        <div class="events__loading-rich" id="events-loading-block" hidden role="status" aria-live="polite">
          <div class="events__loading-head">
            <span class="loading-spinner loading-spinner--accent" aria-hidden="true"></span>
            <span class="events__loading-label">Loading events…</span>
          </div>
          <p class="events__loading-hint">Hang tight while we fetch the latest listings.</p>
        </div>
        <p class="events__empty" id="events-empty-msg" hidden role="status">No events match your search.</p>
        <ul class="events__list" id="mock-events-list"></ul>
        <div class="events__load-more-wrap">
          <button type="button" class="btn btn--ghost events__load-more" id="events-load-more-btn" hidden>
            Load more
          </button>
        </div>
      </section>

      <section class="features" aria-labelledby="features-title">
        <h2 id="features-title" class="features__heading">What you can do</h2>
        <ul class="feature-grid">
          <li class="feature-card">
            <h3 class="feature-card__title">Browse</h3>
            <p class="feature-card__text">Scan upcoming listings at a glance.</p>
          </li>
          <li class="feature-card">
            <h3 class="feature-card__title">Search &amp; filter</h3>
            <p class="feature-card__text">Narrow by date, topic, or location.</p>
          </li>
          <li class="feature-card">
            <h3 class="feature-card__title">Details</h3>
            <p class="feature-card__text">Open an event for time, venue, and notes.</p>
          </li>
          <li class="feature-card">
            <h3 class="feature-card__title">Save &amp; register</h3>
            <p class="feature-card__text">Keep favorites or sign up when you are ready.</p>
          </li>
        </ul>
      </section>
      </div>

      <div id="view-saved" class="view-panel" hidden>
        <section class="saved-panel" aria-labelledby="saved-title">
          <div class="saved-panel__sync" id="saved-sync-hint" hidden role="status">
            <span class="loading-spinner loading-spinner--sm loading-spinner--accent" aria-hidden="true"></span>
            <span>Refreshing saved list…</span>
          </div>
          <h2 id="saved-title" class="saved-panel__title">Saved events</h2>
          <p class="saved-panel__lede">Events you bookmarked from the list.</p>
          <p class="saved-panel__empty" id="saved-empty-msg" hidden role="status">
            No saved events yet. Open Home, find an event in the list, then tap the bookmark on a card.
          </p>
          <ul class="events__list" id="saved-events-list"></ul>
        </section>
      </div>

      <div id="view-post" class="view-panel" hidden>
        ${getPostEventMarkup()}
      </div>
    </main>

    <footer class="footer">
      <!-- <p class="footer__text">HittaEvent</p> -->
    </footer>
  </div>
  ${getEventDetailMarkup()}
  ${getRegisterTicketMarkup()}
  ${getAuthModalMarkup()}
`

document.querySelector('#event-search')?.addEventListener('input', scheduleBrowseSearch)
document.querySelector('#events-load-more-btn')?.addEventListener('click', () => void loadMoreEvents())
const postFormControls = initPostEventForm({
  onCancel: () => {
    postFormControls.resetToCreate()
    showView('browse')
  },
  onSubmit: async (values) => {
    const editingId = document.querySelector('#post-editing-id')?.value?.trim()
    try {
      if (editingId) {
        await patchEvent(editingId, {
          title: values.title,
          category: values.category,
          description: values.description,
          location: values.location,
          date: values.date,
          time: values.time,
          imageUrl: values.imageUrl,
          isFree: values.isFree,
          ticketType: values.isFree ? 'free' : 'paid',
          price: values.price,
        })
      } else {
        await createEvent({
          title: values.title,
          category: values.category,
          description: values.description,
          location: values.location,
          date: values.date,
          time: values.time,
          imageUrl: values.imageUrl,
          isFree: values.isFree,
          price: values.price,
        })
      }
      await loadEvents()
      showView('browse')
      updateEventsView()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      if (/sign in|session|401/i.test(msg)) {
        openAuthModal({
          onSuccess: () => {
            postFormControls.resetToCreate()
            showView('post')
          },
        })
      } else {
        window.alert(msg)
      }
    }
  },
})

function goToAddEvent() {
  if (!getAccessToken()) {
    openAuthModal({
      onSuccess: () => {
        postFormControls.resetToCreate()
        showView('post')
      },
    })
    return
  }
  postFormControls.resetToCreate()
  showView('post')
}

initAuthModal({ onSessionChange: refreshAuthNav })

async function openPostForEdit(eventId) {
  closeEventDetail()
  showView('post')
  setPostPanelBusy(true, 'Loading event for editing…')
  try {
    let ev = allEvents.find((e) => e.id === eventId)
    if (!ev?.startsAt) {
      try {
        ev = await fetchEventById(eventId)
      } catch {
        window.alert('Could not load event for editing.')
        return
      }
    }
    postFormControls.prefillForEdit(ev)
  } finally {
    setPostPanelBusy(false)
  }
}

initEventDetail({
  onToggleSave: (id) => toggleSaved(id),
  onBuyOrRegister: ({ eventId, eventTitle, isFree, price }) => {
    openRegisterTicketModal({ eventId, eventTitle, isFree, price })
  },
  onEdit: async (eventId) => {
    if (!getAccessToken()) {
      openAuthModal({ onSuccess: () => void openPostForEdit(eventId) })
      return
    }
    await openPostForEdit(eventId)
  },
  onDelete: async (eventId) => {
    if (!window.confirm('Delete this event permanently? This cannot be undone.')) return
    setEventDetailActionsDisabled(true)
    try {
      await deleteEvent(eventId)
      closeEventDetail()
      savedEventIds.delete(eventId)
      await loadEvents()
      updateSavedView()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      if (/sign in|session|401/i.test(msg)) {
        openAuthModal({ onSuccess: () => {} })
      } else {
        window.alert(msg)
      }
    } finally {
      setEventDetailActionsDisabled(false)
    }
  },
})

function toggleSaved(id) {
  if (!id) return false
  if (savedEventIds.has(id)) {
    savedEventIds.delete(id)
  } else {
    savedEventIds.add(id)
  }
  updateEventsView()
  updateSavedView()
  return savedEventIds.has(id)
}

async function openEventById(id) {
  if (!id) return
  let event = events.find((ev) => ev.id === id) ?? allEvents.find((ev) => ev.id === id)
  if (!event) {
    const modal = document.querySelector('#event-detail-modal')
    if (modal) {
      modal.hidden = false
      document.body.classList.add('modal-open')
    }
    setEventDetailFetchLoading(true)
    try {
      event = await fetchEventById(id)
      const modalEl = document.querySelector('#event-detail-modal')
      if (!modalEl?.hidden) {
        openEventDetail(event, savedEventIds.has(event.id), { canManage: canManageEvent(event) })
      }
    } catch {
      closeEventDetail()
    } finally {
      setEventDetailFetchLoading(false)
    }
    return
  }
  openEventDetail(event, savedEventIds.has(event.id), { canManage: canManageEvent(event) })
}

document.querySelector('.main')?.addEventListener('click', (e) => {
  const target = e.target
  if (!(target instanceof Element)) return

  const saveBtn = target.closest('button[data-action="save-event"]')
  if (saveBtn) {
    toggleSaved(saveBtn.dataset.eventId)
    return
  }

  const card = target.closest('[data-action="open-event"]')
  if (card instanceof HTMLElement) {
    void openEventById(card.dataset.eventId)
  }
})

document.querySelector('.main')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const target = e.target
  if (!(target instanceof HTMLElement)) return
  const card = target.closest('[data-action="open-event"]')
  if (!(card instanceof HTMLElement)) return
  e.preventDefault()
  void openEventById(card.dataset.eventId)
})

initRegisterTicketModal({
  onSubmit(payload) {
    // Mock-only: no backend; handy for demos in DevTools console
    console.info('[HittaEvent mock booking]', payload)
  },
})

document.querySelector('#nav-home')?.addEventListener('click', () => {
  postFormControls.resetToCreate()
  showView('browse')
})
document.querySelector('#nav-post')?.addEventListener('click', () => goToAddEvent())
document.querySelector('#nav-signout')?.addEventListener('click', () => {
  clearSession()
  refreshAuthNav()
  postFormControls.resetToCreate()
  showView('browse')
})
document.querySelector('#nav-saved')?.addEventListener('click', () => {
  postFormControls.resetToCreate()
  showView('saved')
})

document.querySelector('#logo-home')?.addEventListener('click', (e) => {
  e.preventDefault()
  postFormControls.resetToCreate()
  showView('browse')
})

void loadEvents()
void fetchMe().then(() => refreshAuthNav())
