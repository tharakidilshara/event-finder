import './style.css'
import { renderEventCards } from './components/eventCard.js'
import { getPostEventMarkup, initPostEventForm } from './components/postEvent.js'
import {
  getEventDetailMarkup,
  initEventDetail,
  openEventDetail,
} from './components/eventDetail.js'
import {
  getRegisterTicketMarkup,
  initRegisterTicketModal,
  openRegisterTicketModal,
} from './components/registerTicket.js'

const savedEventIds = new Set()

let mockEvents = [
  {
    id: 'evt-orientation-mixer',
    title: 'Orientation mixer',
    dateLabel: 'Sat, 12 Oct · 5:00 PM',
    location: 'Student Union lawn',
    category: 'Social',
    description: 'Meet clubs, grab snacks, and find your people before term gets busy.',
    imageUrl: 'https://picsum.photos/seed/orientation-mixer/800/450',
    isFree: true,
    price: 0,
  },
  {
    id: 'evt-career-fair-tech',
    title: 'Career fair: tech & design',
    dateLabel: 'Wed, 16 Oct · 10:00 AM',
    location: 'Sports hall',
    category: 'Careers',
    description: 'Employers hiring interns and grads—bring your CV or portfolio link.',
    imageUrl: 'https://picsum.photos/seed/career-fair-tech/800/450',
    isFree: true,
    price: 0,
  },
  {
    id: 'evt-film-night-classics',
    title: 'Film night: classics',
    dateLabel: 'Fri, 18 Oct · 8:00 PM',
    location: 'Lecture theatre B',
    category: 'Arts',
    description: 'Open to all; short intro talk then a restored 35mm screening.',
    imageUrl: 'https://picsum.photos/seed/film-night-classics/800/450',
    isFree: false,
    price: 5,
  },
  {
    id: 'evt-beginner-yoga',
    title: 'Beginner yoga',
    dateLabel: 'Mon, 21 Oct · 7:30 AM',
    location: 'Wellness studio',
    category: 'Wellness',
    description: 'Mats provided. Register on the door if spaces remain.',
    imageUrl: 'https://picsum.photos/seed/beginner-yoga/800/450',
    isFree: false,
    price: 8,
  },
]

function createEventId(title) {
  const base = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const rand = Math.random().toString(16).slice(2, 6)
  return `evt-${base || 'event'}-${Date.now().toString(16)}-${rand}`
}

function formatDateLabel(dateStr, timeStr) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : null
  const dateLabel = date
    ? date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
    : 'TBA'
  const timeLabel = timeStr || 'TBA'
  return `${dateLabel} · ${timeLabel}`
}

function filterEvents(query) {
  const q = query.trim().toLowerCase()
  if (!q) return mockEvents
  return mockEvents.filter((e) => {
    const blob = `${e.title} ${e.dateLabel} ${e.location} ${e.category} ${e.description}`.toLowerCase()
    return blob.includes(q)
  })
}

function updateEventsView() {
  const searchInput = document.querySelector('#event-search')
  const eventsListEl = document.querySelector('#mock-events-list')
  const emptyMsg = document.querySelector('#events-empty-msg')
  if (!searchInput || !eventsListEl || !emptyMsg) return

  const filtered = filterEvents(searchInput.value)
  renderEventCards(eventsListEl, filtered, savedEventIds)
  emptyMsg.hidden = filtered.length > 0
}

function getSavedEvents() {
  return mockEvents.filter((e) => savedEventIds.has(e.id))
}

function updateSavedView() {
  const listEl = document.querySelector('#saved-events-list')
  const emptyMsg = document.querySelector('#saved-empty-msg')
  if (!listEl || !emptyMsg) return
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
      <a class="logo" href="/" id="logo-home">Event Finder</a>
      <nav class="nav" aria-label="Main">
        <button type="button" class="nav__link nav__link--active" id="nav-home" aria-current="page">Home</button>
        <button type="button" class="nav__link" id="nav-post">Add Event</button>
        <button type="button" class="nav__link" id="nav-saved">Saved</button>
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
        <div class="hero__actions">
          <button type="button" class="btn btn--primary" id="explore-events-btn">Explore events</button>
        </div>
      </section>

      <section class="events" id="mock-events-section" hidden aria-labelledby="mock-events-title">
        <p class="events__empty" id="events-empty-msg" hidden role="status">No events match your search.</p>
        <ul class="events__list" id="mock-events-list"></ul>
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
          <h2 id="saved-title" class="saved-panel__title">Saved events</h2>
          <p class="saved-panel__lede">Events you bookmarked from the list.</p>
          <p class="saved-panel__empty" id="saved-empty-msg" hidden role="status">
            No saved events yet. Open Home, explore events, then tap the bookmark on a card.
          </p>
          <ul class="events__list" id="saved-events-list"></ul>
        </section>
      </div>

      <div id="view-post" class="view-panel" hidden>
        ${getPostEventMarkup()}
      </div>
    </main>

    <footer class="footer">
      <!-- <p class="footer__text">Event Finder — simple home for your app shell.</p> -->
    </footer>
  </div>
  ${getEventDetailMarkup()}
  ${getRegisterTicketMarkup()}
`

const exploreBtn = document.querySelector('#explore-events-btn')
const eventsSection = document.querySelector('#mock-events-section')

document.querySelector('#event-search')?.addEventListener('input', updateEventsView)

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

function openEventById(id) {
  if (!id) return
  const event = mockEvents.find((ev) => ev.id === id)
  if (!event) return
  openEventDetail(event, savedEventIds.has(event.id))
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
    openEventById(card.dataset.eventId)
  }
})

document.querySelector('.main')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const target = e.target
  if (!(target instanceof HTMLElement)) return
  const card = target.closest('[data-action="open-event"]')
  if (!(card instanceof HTMLElement)) return
  e.preventDefault()
  openEventById(card.dataset.eventId)
})

initRegisterTicketModal({
  onSubmit(payload) {
    // Mock-only: no backend; handy for demos in DevTools console
    console.info('[EventFinder mock booking]', payload)
  },
})

initEventDetail({
  onToggleSave: (id) => toggleSaved(id),
  onBuyOrRegister: ({ eventId, eventTitle, isFree, price }) => {
    openRegisterTicketModal({ eventId, eventTitle, isFree, price })
  },
})

document.querySelector('#nav-home')?.addEventListener('click', () => showView('browse'))
document.querySelector('#nav-post')?.addEventListener('click', () => showView('post'))
document.querySelector('#nav-saved')?.addEventListener('click', () => showView('saved'))

document.querySelector('#logo-home')?.addEventListener('click', (e) => {
  e.preventDefault()
  showView('browse')
})

initPostEventForm({
  onCancel: () => showView('browse'),
  onSubmit: (values, form) => {
    const newEvent = {
      id: createEventId(values.title),
      title: values.title,
      dateLabel: formatDateLabel(values.date, values.time),
      location: values.location,
      category: values.category,
      description: values.description,
      imageUrl: values.imageUrl,
      isFree: values.isFree,
      price: values.price,
    }

    mockEvents = [newEvent, ...mockEvents]
    form.reset()

    showView('browse')
    updateEventsView()
    if (eventsSection) eventsSection.hidden = false
  },
})

exploreBtn?.addEventListener('click', () => {
  if (!eventsSection) return

  updateEventsView()
  eventsSection.hidden = false
  eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
