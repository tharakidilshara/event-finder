/**
 * Mock register / buy ticket flow (no real payment).
 * @typedef {object} RegisterContext
 * @property {string} eventId
 * @property {string} eventTitle
 * @property {boolean} isFree
 * @property {number} price
 */

function formatPrice(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n <= 0) return '$0'
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

/**
 * @returns {string}
 */
export function getRegisterTicketMarkup() {
  return `
    <div class="modal modal--register" id="register-ticket-modal" hidden role="dialog" aria-modal="true" aria-labelledby="register-ticket-title">
      <div class="modal__backdrop" data-action="close-register"></div>
      <div class="modal__panel modal__panel--form" role="document">
        <button type="button" class="modal__close" data-action="close-register" aria-label="Close registration form">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div class="register-modal__inner">
          <div id="register-ticket-form-wrap">
            <h2 class="register-modal__title" id="register-ticket-title">Register for event</h2>
            <p class="register-modal__event" id="register-ticket-event-line"></p>
            <p class="register-modal__mock-hint" id="register-ticket-mock-line"></p>

            <form id="register-ticket-form" class="post-form register-form" novalidate>
              <div class="post-form__grid">
                <div class="post-form__field post-form__field--full">
                  <label class="post-form__label" for="register-full-name">Full name</label>
                  <input class="post-form__input" id="register-full-name" name="fullName" required autocomplete="name" placeholder="Your name" />
                </div>
                <div class="post-form__field post-form__field--full">
                  <label class="post-form__label" for="register-email">Email</label>
                  <input class="post-form__input" id="register-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com" />
                </div>
                <div class="post-form__field post-form__field--full">
                  <label class="post-form__label" for="register-phone">Phone <span class="post-form__hint">(optional)</span></label>
                  <input class="post-form__input" id="register-phone" name="phone" type="tel" autocomplete="tel" placeholder="e.g. +1 555 0100" />
                </div>
                <div class="post-form__field post-form__field--full">
                  <label class="post-form__label" for="register-address">Street address</label>
                  <input class="post-form__input" id="register-address" name="address" required autocomplete="street-address" placeholder="Building, street" />
                </div>
                <div class="post-form__field">
                  <label class="post-form__label" for="register-city">City</label>
                  <input class="post-form__input" id="register-city" name="city" required autocomplete="address-level2" placeholder="City" />
                </div>
                <div class="post-form__field">
                  <label class="post-form__label" for="register-postal">Postal code <span class="post-form__hint">(optional)</span></label>
                  <input class="post-form__input" id="register-postal" name="postalCode" autocomplete="postal-code" placeholder="Postal / ZIP" />
                </div>
                <div class="post-form__field post-form__field--full" id="register-tickets-field" hidden>
                  <label class="post-form__label" for="register-qty">Number of tickets</label>
                  <input class="post-form__input" id="register-qty" name="ticketQty" type="number" min="1" max="20" step="1" value="1" />
                </div>
                <div class="post-form__field post-form__field--full">
                  <label class="post-form__label" for="register-notes">Notes <span class="post-form__hint">(optional)</span></label>
                  <textarea class="post-form__textarea" id="register-notes" name="notes" rows="3" placeholder="Allergies, accessibility, student ID…"></textarea>
                </div>
              </div>
              <p class="register-modal__fine-print">This is a mock flow only — nothing is charged and no emails are sent.</p>
              <div class="post-form__actions">
                <button type="button" class="btn btn--ghost" data-action="close-register">Cancel</button>
                <button type="submit" class="btn btn--primary" id="register-submit-btn">Confirm</button>
              </div>
            </form>
          </div>

          <div id="register-ticket-success" class="register-modal__success" hidden role="status">
            <p class="register-modal__success-title">You are all set</p>
            <p class="register-modal__success-text" id="register-ticket-success-msg"></p>
            <button type="button" class="btn btn--primary register-modal__success-btn" data-action="close-register">Done</button>
          </div>
        </div>
      </div>
    </div>
  `
}

/** @type {RegisterContext | null} */
let context = null

function getModal() {
  return document.querySelector('#register-ticket-modal')
}

export function closeRegisterTicketModal() {
  const modal = getModal()
  if (!modal) return
  modal.hidden = true
  const formWrap = document.querySelector('#register-ticket-form-wrap')
  const successEl = document.querySelector('#register-ticket-success')
  const form = /** @type {HTMLFormElement | null} */ (document.querySelector('#register-ticket-form'))
  formWrap?.removeAttribute('hidden')
  successEl?.setAttribute('hidden', '')
  form?.reset()
  const qty = /** @type {HTMLInputElement | null} */ (document.querySelector('#register-qty'))
  if (qty) qty.value = '1'
  context = null
}

/**
 * @param {RegisterContext} ctx
 */
export function openRegisterTicketModal(ctx) {
  const modal = getModal()
  if (!modal) return
  context = ctx

  const title = /** @type {HTMLHeadingElement | null} */ (document.querySelector('#register-ticket-title'))
  const eventLine = document.querySelector('#register-ticket-event-line')
  const mockLine = document.querySelector('#register-ticket-mock-line')
  const ticketsField = document.querySelector('#register-tickets-field')
  const submitBtn = document.querySelector('#register-submit-btn')

  const formWrap = document.querySelector('#register-ticket-form-wrap')
  const successEl = document.querySelector('#register-ticket-success')
  formWrap?.removeAttribute('hidden')
  successEl?.setAttribute('hidden', '')
  document.querySelector('#register-ticket-form')?.reset()
  /** @type {HTMLInputElement | null} */
  const qtyReset = document.querySelector('#register-qty')
  if (qtyReset) qtyReset.value = '1'

  const free = ctx.isFree
  if (title) title.textContent = free ? 'Free registration' : 'Book tickets (mock)'
  if (eventLine) eventLine.textContent = ctx.eventTitle
  if (mockLine) {
    mockLine.textContent = free
      ? 'Reserve your spot — no payment.'
      : `Mock ticket price ${formatPrice(ctx.price)} each — checkout is simulated only.`
  }
  if (ticketsField) ticketsField.hidden = free
  if (submitBtn) submitBtn.textContent = free ? 'Confirm registration' : 'Confirm mock booking'

  modal.hidden = false
  /** @type {HTMLInputElement | null} */
  const first = document.querySelector('#register-full-name')
  first?.focus()
}

/** @returns {boolean} */
export function isRegisterTicketModalOpen() {
  const modal = getModal()
  return !!modal && !modal.hidden
}

/**
 * @param {{
 *   onSubmit?: (payload: RegisterContext & Record<string, unknown>) => void,
 * }} [opts]
 */
export function initRegisterTicketModal(opts = {}) {
  const modal = getModal()
  if (!modal) return

  const form = /** @type {HTMLFormElement | null} */ (document.querySelector('#register-ticket-form'))

  modal.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement | null} */ (e.target?.closest('[data-action="close-register"]'))
    if (!target) return
    closeRegisterTicketModal()
  })

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    if (!context) return

    const fd = new FormData(form)
    const fullName = String(fd.get('fullName') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const phone = String(fd.get('phone') || '').trim()
    const address = String(fd.get('address') || '').trim()
    const city = String(fd.get('city') || '').trim()
    const postalCode = String(fd.get('postalCode') || '').trim()
    const notes = String(fd.get('notes') || '').trim()
    let ticketQty = 1
    if (!context.isFree) {
      const q = Number(fd.get('ticketQty'))
      ticketQty = Number.isFinite(q) && q >= 1 ? Math.min(20, Math.floor(q)) : 1
    }

    const payload = {
      ...context,
      fullName,
      email,
      phone,
      address,
      city,
      postalCode,
      notes,
      ticketQty,
    }
    opts.onSubmit?.(payload)

    const formWrap = document.querySelector('#register-ticket-form-wrap')
    const successEl = document.querySelector('#register-ticket-success')
    const msg = document.querySelector('#register-ticket-success-msg')

    let successCopy = ''
    if (context.isFree) {
      successCopy = `Thanks, ${fullName}. Your free registration for “${context.eventTitle}” is recorded locally for this demo.`
    } else {
      const total = context.price * ticketQty
      successCopy = `Thanks, ${fullName}. Mock booking: ${ticketQty} × ${formatPrice(context.price)} = ${formatPrice(total)} — no payment taken.`
    }
    if (msg) msg.textContent = successCopy

    formWrap?.setAttribute('hidden', '')
    successEl?.removeAttribute('hidden')
    /** @type {HTMLButtonElement | null} */
    const doneBtn = successEl?.querySelector('.register-modal__success-btn')
    doneBtn?.focus()
  })

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !isRegisterTicketModalOpen()) return
      e.preventDefault()
      e.stopPropagation()
      closeRegisterTicketModal()
    },
    true,
  )
}
