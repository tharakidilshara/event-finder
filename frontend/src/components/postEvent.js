/**
 * Markup for the "Post an event" tab.
 * Returned as a string so it can be injected into the page shell template.
 * @returns {string}
 */
export function getPostEventMarkup() {
  return `
    <section class="post-panel" aria-labelledby="post-title">
      <h2 id="post-title" class="saved-panel__title">Post an event</h2>
      <p class="saved-panel__lede">Create a new event (mock only — no database yet).</p>

      <form id="post-event-form" class="post-form">
        <div class="post-form__grid">
          <div class="post-form__field">
            <label class="post-form__label" for="post-title-input">Title</label>
            <input class="post-form__input" id="post-title-input" name="title" required placeholder="e.g. Hackathon kickoff" />
          </div>

          <div class="post-form__field">
            <label class="post-form__label" for="post-category-input">Category</label>
            <input class="post-form__input" id="post-category-input" name="category" required placeholder="e.g. Tech" />
          </div>

          <div class="post-form__field">
            <label class="post-form__label" for="post-date-input">Date</label>
            <input class="post-form__input" id="post-date-input" name="date" type="date" required />
          </div>

          <div class="post-form__field">
            <label class="post-form__label" for="post-time-input">Time</label>
            <input class="post-form__input" id="post-time-input" name="time" type="time" required />
          </div>

          <div class="post-form__field post-form__field--full">
            <label class="post-form__label" for="post-location-input">Location</label>
            <input class="post-form__input" id="post-location-input" name="location" required placeholder="e.g. Auditorium A" />
          </div>

          <div class="post-form__field post-form__field--full">
            <span class="post-form__label">Ticket type</span>
            <div class="post-form__radio-group" role="radiogroup" aria-label="Ticket type">
              <label class="post-form__radio">
                <input type="radio" name="ticketType" value="free" checked />
                <span class="post-form__radio-label">Free</span>
              </label>
              <label class="post-form__radio">
                <input type="radio" name="ticketType" value="paid" />
                <span class="post-form__radio-label">Paid</span>
              </label>
            </div>
          </div>

          <div class="post-form__field post-form__field--full" id="post-price-field" hidden>
            <label class="post-form__label" for="post-price-input">Ticket price (USD)</label>
            <input
              class="post-form__input"
              id="post-price-input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="e.g. 12.50"
            />
          </div>

          <div class="post-form__field post-form__field--full">
            <label class="post-form__label" for="post-image-input">Photo <span class="post-form__hint">(optional)</span></label>
            <input class="post-form__file" id="post-image-input" name="image" type="file" accept="image/*" />
            <div class="post-form__preview" id="post-image-preview" hidden>
              <img class="post-form__preview-img" id="post-image-preview-img" alt="Selected event photo preview" />
              <button type="button" class="post-form__preview-remove" id="post-image-remove">Remove photo</button>
            </div>
          </div>

          <div class="post-form__field post-form__field--full">
            <label class="post-form__label" for="post-desc-input">Description</label>
            <textarea class="post-form__textarea" id="post-desc-input" name="description" rows="4" required placeholder="Short details about the event…"></textarea>
          </div>
        </div>

        <div class="post-form__actions">
          <button type="button" class="btn btn--ghost" id="post-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn--primary">Post event</button>
        </div>
      </form>
    </section>
  `
}

/**
 * Values collected from the post-event form.
 * @typedef {object} PostEventFormValues
 * @property {string} title
 * @property {string} category
 * @property {string} date
 * @property {string} time
 * @property {string} location
 * @property {string} description
 * @property {string} imageUrl - data: URL of the selected photo, or '' if none
 * @property {boolean} isFree
 * @property {number} price - ticket price in USD; 0 when isFree is true
 */

/**
 * Wire up the form submission, cancel button, and photo preview for the Post tab.
 * Caller decides what to do with the validated values (e.g. push into the
 * mock list and switch views) and how to handle cancel.
 *
 * @param {{
 *   onSubmit: (values: PostEventFormValues, form: HTMLFormElement) => void,
 *   onCancel?: () => void,
 * }} handlers
 */
export function initPostEventForm({ onSubmit, onCancel }) {
  const form = /** @type {HTMLFormElement | null} */ (document.querySelector('#post-event-form'))
  const cancelBtn = document.querySelector('#post-cancel-btn')
  const fileInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-image-input'))
  const previewWrap = document.querySelector('#post-image-preview')
  const previewImg = /** @type {HTMLImageElement | null} */ (document.querySelector('#post-image-preview-img'))
  const removeBtn = document.querySelector('#post-image-remove')
  const priceField = document.querySelector('#post-price-field')
  const priceInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-price-input'))
  const ticketRadios = /** @type {NodeListOf<HTMLInputElement>} */ (
    document.querySelectorAll('input[name="ticketType"]')
  )

  let imageDataUrl = ''

  function clearImage() {
    imageDataUrl = ''
    if (fileInput) fileInput.value = ''
    if (previewImg) previewImg.removeAttribute('src')
    if (previewWrap) previewWrap.hidden = true
  }

  function syncPriceFieldVisibility() {
    const selected = /** @type {HTMLInputElement | undefined} */ (
      Array.from(ticketRadios).find((r) => r.checked)
    )
    const isPaid = selected?.value === 'paid'
    if (priceField) priceField.hidden = !isPaid
    if (priceInput) {
      priceInput.required = isPaid
      if (!isPaid) priceInput.value = ''
    }
  }

  ticketRadios.forEach((radio) => {
    radio.addEventListener('change', syncPriceFieldVisibility)
  })
  syncPriceFieldVisibility()

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (!file) {
      clearImage()
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      imageDataUrl = String(reader.result || '')
      if (previewImg) previewImg.src = imageDataUrl
      if (previewWrap) previewWrap.hidden = false
    }
    reader.readAsDataURL(file)
  })

  removeBtn?.addEventListener('click', () => {
    clearImage()
  })

  cancelBtn?.addEventListener('click', () => {
    clearImage()
    onCancel?.()
  })

  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const fd = new FormData(form)
    const ticketType = String(fd.get('ticketType') || 'free')
    const isFree = ticketType !== 'paid'
    const rawPrice = String(fd.get('price') || '').trim()
    const parsedPrice = Number(rawPrice)
    const price = isFree || !rawPrice || Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice)

    const values = {
      title: String(fd.get('title') || '').trim(),
      category: String(fd.get('category') || '').trim(),
      date: String(fd.get('date') || '').trim(),
      time: String(fd.get('time') || '').trim(),
      location: String(fd.get('location') || '').trim(),
      description: String(fd.get('description') || '').trim(),
      imageUrl: imageDataUrl,
      isFree,
      price,
    }

    if (
      !values.title ||
      !values.category ||
      !values.date ||
      !values.time ||
      !values.location ||
      !values.description
    ) {
      return
    }

    if (!isFree && !(price > 0)) {
      priceInput?.focus()
      return
    }

    onSubmit(values, form)
    clearImage()
    syncPriceFieldVisibility()
  })
}
