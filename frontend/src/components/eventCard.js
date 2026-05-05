/**
 * One event in the list (shape matches mock / future API rows).
 * @typedef {object} EventRecord
 * @property {string} id
 * @property {string} title
 * @property {string} dateLabel
 * @property {string} location
 * @property {string} category
 * @property {string} description
 */

function bookmarkIconSvg(isFilled) {
  if (isFilled) {
    return `<svg class="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`
  }
  return `<svg class="event-card__save-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
}

/**
 * Build a single event row for the list.
 * @param {EventRecord} event
 * @param {boolean} isSaved
 * @returns {HTMLLIElement}
 */
export function createEventCardElement(event, isSaved) {
  const li = document.createElement('li')
  li.className = 'event-card'

  const meta = document.createElement('div')
  meta.className = 'event-card__meta'

  const category = document.createElement('span')
  category.className = 'event-card__category'
  category.textContent = event.category
  meta.appendChild(category)

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

  li.append(meta, title, when, where, desc, saveBtn)
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
