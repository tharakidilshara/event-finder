/**
 * One event in the list (shape matches mock / future API rows).
 * @typedef {object} EventRecord
 * @property {string} title
 * @property {string} dateLabel
 * @property {string} location
 * @property {string} category
 * @property {string} description
 */

/**
 * Build a single event row for the list.
 * @param {EventRecord} event
 * @returns {HTMLLIElement}
 */
export function createEventCardElement(event) {
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

  li.append(meta, title, when, where, desc)
  return li
}

/**
 * Render the full list (replaces existing children).
 * @param {HTMLUListElement} listElement
 * @param {EventRecord[]} events
 */
export function renderEventCards(listElement, events) {
  listElement.replaceChildren(...events.map(createEventCardElement))
}
