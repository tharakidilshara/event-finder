import './style.css'

type MockEvent = {
  title: string
  dateLabel: string
  location: string
  category: string
  description: string
}

const mockEvents: MockEvent[] = [
  {
    title: 'Orientation mixer',
    dateLabel: 'Sat, 12 Oct · 5:00 PM',
    location: 'Student Union lawn',
    category: 'Social',
    description: 'Meet clubs, grab snacks, and find your people before term gets busy.',
  },
  {
    title: 'Career fair: tech & design',
    dateLabel: 'Wed, 16 Oct · 10:00 AM',
    location: 'Sports hall',
    category: 'Careers',
    description: 'Employers hiring interns and grads—bring your CV or portfolio link.',
  },
  {
    title: 'Film night: classics',
    dateLabel: 'Fri, 18 Oct · 8:00 PM',
    location: 'Lecture theatre B',
    category: 'Arts',
    description: 'Open to all; short intro talk then a restored 35mm screening.',
  },
  {
    title: 'Beginner yoga',
    dateLabel: 'Mon, 21 Oct · 7:30 AM',
    location: 'Wellness studio',
    category: 'Wellness',
    description: 'Mats provided. Register on the door if spaces remain.',
  },
]

function renderEventCards(container: HTMLElement): void {
  container.innerHTML = mockEvents
    .map(
      (e) => `
    <li class="event-card">
      <div class="event-card__meta">
        <span class="event-card__category">${e.category}</span>
      </div>
      <h3 class="event-card__title">${e.title}</h3>
      <p class="event-card__when">${e.dateLabel}</p>
      <p class="event-card__where">${e.location}</p>
      <p class="event-card__desc">${e.description}</p>
    </li>
  `,
    )
    .join('')
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="page">
    <header class="header">
      <a class="logo" href="/">Event Finder</a>
      <nav class="nav" aria-label="Main">
        <a class="nav__link" href="/">Home</a>
        <span class="nav__muted">Browse</span>
        <span class="nav__muted">Saved</span>
      </nav>
    </header>

    <main class="main">
      <section class="hero" aria-labelledby="hero-title">
        <p class="hero__eyebrow">Campus &amp; community</p>
        <h1 id="hero-title" class="hero__title">Find events that fit your week</h1>
        <p class="hero__lede">
          Browse what is on nearby, filter by what matters to you, then save a spot or register in one place.
        </p>
        <div class="hero__actions">
          <button type="button" class="btn btn--primary" id="explore-events-btn">Explore events</button>
          <button type="button" class="btn btn--ghost">How it works</button>
        </div>
      </section>

      <section class="events" id="mock-events-section" hidden aria-labelledby="mock-events-title">
        <h2 id="mock-events-title" class="events__title">Mock events</h2>
        <p class="events__hint">Sample data for the UI—swap in a real API later.</p>
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
    </main>

    <footer class="footer">
      <p class="footer__text">Event Finder — simple home for your app shell.</p>
    </footer>
  </div>
`

const exploreBtn = document.querySelector<HTMLButtonElement>('#explore-events-btn')
const eventsSection = document.querySelector<HTMLElement>('#mock-events-section')
const eventsList = document.querySelector<HTMLUListElement>('#mock-events-list')

exploreBtn?.addEventListener('click', () => {
  if (!eventsSection || !eventsList) return

  renderEventCards(eventsList)
  eventsSection.hidden = false
  eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
