/**
 * Modal that shows the full details of a single event.
 * @typedef {import('./eventCard.js').EventRecord & { imageUrl?: string }} EventRecord
 */

function bookmarkSvg(filled) {
  if (filled) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
}

const TICKET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v14"/></svg>`

const SPARKLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 5.6 2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></svg>`

function formatPrice(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n <= 0) return '$0'
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

/**
 * Markup for the (initially hidden) event-detail modal.
 * Should be inserted once into the page shell.
 * @returns {string}
 */
export function getEventDetailMarkup() {
  return `
    <div class="modal" id="event-detail-modal" hidden role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
      <div class="modal__backdrop" data-action="close-detail"></div>
      <div class="modal__panel" role="document">
        <button type="button" class="modal__close" data-action="close-detail" aria-label="Close details">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div class="modal__media">
          <img class="modal__image" id="event-detail-image" alt="" />
          <p class="modal__no-image" id="event-detail-no-image" hidden>No photo provided</p>
        </div>
        <div class="modal__content">
          <div class="modal__chips">
            <span class="event-card__category" id="event-detail-category"></span>
            <span class="modal__price-badge" id="event-detail-price"></span>
          </div>
          <h2 class="modal__title" id="event-detail-title"></h2>
          <p class="modal__when" id="event-detail-when"></p>
          <p class="modal__where" id="event-detail-where"></p>
          <p class="modal__desc" id="event-detail-desc"></p>
          <p class="modal__notice" id="event-detail-notice" role="status" hidden></p>
          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" data-action="close-detail">Close</button>
            <button type="button" class="btn btn--ghost modal__save" id="event-detail-save" data-action="toggle-save">
              <span class="modal__save-icon" id="event-detail-save-icon"></span>
              <span class="modal__save-label" id="event-detail-save-label">Save event</span>
            </button>
            <button type="button" class="btn btn--primary modal__buy" id="event-detail-buy" data-action="buy-ticket">
              <span class="modal__buy-icon" id="event-detail-buy-icon" aria-hidden="true"></span>
              <span class="modal__buy-label" id="event-detail-buy-label">Buy ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

let currentEventId = ''
let currentEventIsFree = true
let currentEventPrice = 0

function setBuyButtonState(isFree, price) {
  const btn = document.querySelector('#event-detail-buy')
  const iconEl = document.querySelector('#event-detail-buy-icon')
  const labelEl = document.querySelector('#event-detail-buy-label')
  const priceBadge = document.querySelector('#event-detail-price')

  if (btn) {
    btn.classList.toggle('modal__buy--free', isFree)
    btn.classList.toggle('modal__buy--paid', !isFree)
  }

  if (iconEl) {
    iconEl.innerHTML = isFree ? SPARKLE_SVG : TICKET_SVG
  }

  if (labelEl) {
    labelEl.textContent = isFree ? 'Register · Free' : `Buy ticket · ${formatPrice(price)}`
  }

  if (priceBadge) {
    priceBadge.textContent = isFree ? 'Free' : formatPrice(price)
    priceBadge.classList.toggle('modal__price-badge--free', isFree)
    priceBadge.classList.toggle('modal__price-badge--paid', !isFree)
  }
}

function setSaveButtonState(isSaved) {
  const iconEl = document.querySelector('#event-detail-save-icon')
  const labelEl = document.querySelector('#event-detail-save-label')
  const btn = document.querySelector('#event-detail-save')
  if (!iconEl || !labelEl || !btn) return
  iconEl.innerHTML = bookmarkSvg(isSaved)
  labelEl.textContent = isSaved ? 'Saved' : 'Save event'
  btn.classList.toggle('modal__save--active', isSaved)
  btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false')
}

function setNotice(text, tone) {
  const el = document.querySelector('#event-detail-notice')
  if (!el) return
  if (text) {
    el.textContent = text
    el.hidden = false
    el.classList.remove('modal__notice--info', 'modal__notice--warn')
    el.classList.add(tone === 'warn' ? 'modal__notice--warn' : 'modal__notice--info')
  } else {
    el.textContent = ''
    el.hidden = true
  }
}

/**
 * Populate the modal with an event's data and reveal it.
 * @param {EventRecord} event
 * @param {boolean} isSaved
 */
export function openEventDetail(event, isSaved) {
  const modal = document.querySelector('#event-detail-modal')
  if (!modal) return

  currentEventId = event.id
  currentEventIsFree = event.isFree !== false && !(Number(event.price) > 0)
  currentEventPrice = Number(event.price) > 0 ? Number(event.price) : 0

  const img = /** @type {HTMLImageElement | null} */ (document.querySelector('#event-detail-image'))
  const noImg = document.querySelector('#event-detail-no-image')
  const category = document.querySelector('#event-detail-category')
  const title = document.querySelector('#event-detail-title')
  const when = document.querySelector('#event-detail-when')
  const where = document.querySelector('#event-detail-where')
  const desc = document.querySelector('#event-detail-desc')

  if (img && noImg) {
    if (event.imageUrl) {
      img.src = event.imageUrl
      img.alt = event.title
      img.hidden = false
      noImg.hidden = true
    } else {
      img.hidden = true
      img.removeAttribute('src')
      noImg.hidden = false
    }
  }

  if (category) category.textContent = event.category
  if (title) title.textContent = event.title
  if (when) when.textContent = event.dateLabel
  if (where) where.textContent = event.location
  if (desc) desc.textContent = event.description

  setSaveButtonState(isSaved)
  setBuyButtonState(currentEventIsFree, currentEventPrice)
  setNotice('')

  modal.hidden = false
  document.body.classList.add('modal-open')

  const closeBtn = /** @type {HTMLButtonElement | null} */ (modal.querySelector('.modal__close'))
  closeBtn?.focus()
}

export function closeEventDetail() {
  const modal = document.querySelector('#event-detail-modal')
  if (!modal) return
  modal.hidden = true
  document.body.classList.remove('modal-open')
  setNotice('')
  currentEventId = ''
}

/**
 * Wire up close (X / backdrop / Escape) and save-toggle handlers for the modal.
 * @param {{
 *   onToggleSave: (eventId: string) => boolean,
 *   onBuyOrRegister?: (payload: {
 *     eventId: string,
 *     eventTitle: string,
 *     isFree: boolean,
 *     price: number,
 *   }) => void,
 * }} handlers - `onToggleSave` should toggle the saved set and return the new
 *               isSaved boolean so the modal can refresh its button state.
 */
export function initEventDetail({ onToggleSave, onBuyOrRegister }) {
  const modal = document.querySelector('#event-detail-modal')
  if (!modal) return

  modal.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement | null} */ (e.target)
    if (!target) return

    if (target.closest('[data-action="close-detail"]')) {
      closeEventDetail()
      return
    }

    if (target.closest('[data-action="toggle-save"]')) {
      if (!currentEventId) return
      const nowSaved = onToggleSave(currentEventId)
      setSaveButtonState(nowSaved)
      return
    }

    if (target.closest('[data-action="buy-ticket"]')) {
      if (!currentEventId) return
      const titleEl = document.querySelector('#event-detail-title')
      const eventTitle = titleEl?.textContent?.trim() || 'Event'
      setNotice('')
      onBuyOrRegister?.({
        eventId: currentEventId,
        eventTitle,
        isFree: currentEventIsFree,
        price: currentEventPrice,
      })
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || modal.hidden) return
    /** @type {HTMLElement | null} */
    const reg = document.querySelector('#register-ticket-modal')
    if (reg && !reg.hidden) return
    closeEventDetail()
  })
}
