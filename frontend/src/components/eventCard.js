/**
 * One event in the list (shape matches mock / future API rows).
 * @typedef {object} EventRecord
 * @property {string} id
 * @property {string} title
 * @property {string} dateLabel
 * @property {string} location
 * @property {string} category
 * @property {string} description
 * @property {string} [imageUrl]
 * @property {boolean} [isFree]
 * @property {number} [price]
 * @property {string} [startsAt] - ISO datetime from API (for edit form)
 * @property {{ id: string, name: string, email: string } | null} [creator]
 */

function formatPriceLabel(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n <= 0) return '$0'
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

function bookmarkIconSvg(isFilled) {
  if (isFilled) {
    return `<svg class="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`
  }
  return `<svg class="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
}

/**
 * Build a single event row for the list. The `<li>` itself is the click
 * target — `data-action="open-event"` lets a delegated handler open the
 * detail modal. The save button stops bubbling via its own `data-action`
 * marker.
 *
 * @param {EventRecord} event
 * @param {boolean} isSaved
 * @returns {HTMLLIElement}
 */
export function createEventCardElement(event, isSaved) {
  const li = document.createElement('li')
  li.className = 'event-card'
  li.dataset.action = 'open-event'
  li.dataset.eventId = event.id
  li.setAttribute('role', 'button')
  li.setAttribute('tabindex', '0')
  li.setAttribute('aria-label', `View details for ${event.title}`)

  const body = document.createElement('div')
  body.className = 'event-card__body'

  const meta = document.createElement('div')
  meta.className = 'event-card__meta'

  const category = document.createElement('span')
  category.className = 'event-card__category'
  category.textContent = event.category
  meta.appendChild(category)

  const isFree = event.isFree !== false && !(Number(event.price) > 0)
  const priceTag = document.createElement('span')
  priceTag.className = `event-card__price ${
    isFree ? 'event-card__price--free' : 'event-card__price--paid'
  }`
  priceTag.textContent = isFree ? 'Free' : formatPriceLabel(event.price)
  meta.appendChild(priceTag)

  const title = document.createElement('h3')
  title.className = 'event-card__title'
  title.textContent = event.title

  const when = document.createElement('p')
  when.className = 'event-card__when'
  when.textContent = event.dateLabel

  const where = document.createElement('p')
  where.className = 'event-card__where'
  where.textContent = event.location

  const desc = document.createElement('p')
  desc.className = 'event-card__desc'
  desc.textContent = event.description

  body.append(meta, title, when, where, desc)

  const thumbCell = document.createElement('div')
  thumbCell.className = 'event-card__thumb-cell'

  let thumb
  if (event.imageUrl) {
    thumb = document.createElement('img')
    thumb.className = 'event-card__thumb'
    thumb.src = event.imageUrl
    thumb.alt = ''
    thumb.loading = 'lazy'
  } else {
    thumb = document.createElement('div')
    thumb.className = 'event-card__thumb event-card__thumb--placeholder'
    thumb.setAttribute('aria-hidden', 'true')
  }
  thumbCell.appendChild(thumb)

  const saveBtn = document.createElement('button')
  saveBtn.type = 'button'
  saveBtn.className = 'event-card__save'
  saveBtn.dataset.action = 'save-event'
  saveBtn.dataset.eventId = event.id
  saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false')
  saveBtn.setAttribute(
    'aria-label',
    isSaved ? `Remove “${event.title}” from saved` : `Save “${event.title}”`,
  )
  saveBtn.title = isSaved ? 'Remove from saved' : 'Save event'
  saveBtn.innerHTML = bookmarkIconSvg(isSaved)
  if (isSaved) saveBtn.classList.add('event-card__save--saved')

  li.append(body, thumbCell, saveBtn)
  return li
}

/**
 * Render the full list (replaces existing children).
 * @param {HTMLUListElement} listElement
 * @param {EventRecord[]} events
 * @param {Set<string>} savedIds
 */
export function renderEventCards(listElement, events, savedIds) {
  listElement.replaceChildren(
    ...events.map((event) => createEventCardElement(event, savedIds.has(event.id))),
  )
}

/**
 * Placeholder rows while events are loading from the API.
 * @param {HTMLUListElement} listElement
 * @param {number} [count]
 */
export function renderEventSkeletons(listElement, count = 4) {
  const n = Math.max(1, Math.min(8, count))
  const items = []
  for (let i = 0; i < n; i += 1) {
    const li = document.createElement('li')
    li.className = 'event-card event-card--skeleton'
    li.setAttribute('role', 'presentation')
    li.setAttribute('aria-hidden', 'true')
    li.innerHTML = `
      <div class="event-card__skeleton-body">
        <div class="event-card__skeleton-chip"></div>
        <div class="event-card__skeleton-line event-card__skeleton-line--lg"></div>
        <div class="event-card__skeleton-line event-card__skeleton-line--md"></div>
        <div class="event-card__skeleton-line event-card__skeleton-line--sm"></div>
        <div class="event-card__skeleton-line event-card__skeleton-line--full"></div>
      </div>
      <div class="event-card__thumb-cell" aria-hidden="true">
        <div class="event-card__skeleton-thumb"></div>
      </div>
    `
    items.push(li)
  }
  listElement.replaceChildren(...items)
}
