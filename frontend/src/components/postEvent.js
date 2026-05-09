/**
 * Markup for the "Post an event" tab.
 * Returned as a string so it can be injected into the page shell template.
 * @returns {string}
 */
export function getPostEventMarkup() {
  return `
    <section class="post-panel" aria-labelledby="post-title">
      <div class="post-panel__busy" id="post-panel-busy" hidden aria-live="polite">
        <span class="loading-spinner loading-spinner--accent" aria-hidden="true"></span>
        <p class="post-panel__busy-text" id="post-panel-busy-text">Loading…</p>
      </div>

      <h2 id="post-title" class="saved-panel__title">Post an event</h2>
      <p class="saved-panel__lede" id="post-panel-lede">Add a new campus event — saved to the database.</p>

      <div class="post-form-stack">
      <form id="post-event-form" class="post-form">
        <input type="hidden" id="post-editing-id" name="editingEventId" value="" />
        <input type="hidden" id="post-existing-image-url" value="" />

        <p class="post-form__error" id="post-form-error" hidden role="alert"></p>

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
          <button type="submit" class="btn btn--primary" id="post-submit-btn">
            <span class="btn__spinner" id="post-submit-spinner" hidden aria-hidden="true"></span>
            <span id="post-submit-label">Post event</span>
          </button>
        </div>
      </form>

      <div class="post-form__overlay" id="post-form-overlay" hidden aria-hidden="true">
        <span class="loading-spinner loading-spinner--lg loading-spinner--on-elevated" aria-hidden="true"></span>
        <p class="post-form__overlay-text" id="post-form-overlay-text">Saving…</p>
      </div>
      </div>
    </section>
  `
}

/**
 * Full-panel busy state (e.g. while fetching event data before edit prefill).
 * @param {boolean} visible
 * @param {string} [message]
 */
export function setPostPanelBusy(visible, message = 'Loading…') {
  const el = document.querySelector('#post-panel-busy')
  const text = document.querySelector('#post-panel-busy-text')
  if (text && message) text.textContent = message
  if (el) el.hidden = !visible
}

/**
 * @param {string} iso
 * @returns {string} YYYY-MM-DD local
 */
function isoToDateInput(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {string} iso
 * @returns {string} HH:mm local
 */
function isoToTimeInput(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
 * @property {string} imageUrl - data URL from file, existing URL, or ''
 * @property {boolean} isFree
 * @property {number} price - ticket price in USD; 0 when isFree is true
 */

/**
 * Wire up the form submission, cancel button, and photo preview for the Post tab.
 *
 * @param {{
 *   onSubmit: (values: PostEventFormValues, form: HTMLFormElement) => void | Promise<void>,
 *   onCancel?: () => void,
 * }} handlers
 * @returns {{ resetToCreate: () => void, prefillForEdit: (apiEvent: Record<string, unknown>) => void }}
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
  const submitBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('#post-submit-btn'))
  const submitSpinner = document.querySelector('#post-submit-spinner')
  const submitLabel = document.querySelector('#post-submit-label')
  const formOverlay = document.querySelector('#post-form-overlay')
  const formOverlayText = document.querySelector('#post-form-overlay-text')
  const editingIdInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-editing-id'))
  const existingImageInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-existing-image-url'))
  const formError = document.querySelector('#post-form-error')
  const panelTitle = document.querySelector('#post-title')
  const panelLede = document.querySelector('#post-panel-lede')

  let imageDataUrl = ''

  function setFormError(text) {
    if (!formError) return
    if (text) {
      formError.textContent = text
      formError.hidden = false
    } else {
      formError.textContent = ''
      formError.hidden = true
    }
  }

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

  function resetToCreate() {
    if (editingIdInput) editingIdInput.value = ''
    if (existingImageInput) existingImageInput.value = ''
    clearImage()
    form?.reset()
    syncPriceFieldVisibility()
    if (panelTitle) panelTitle.textContent = 'Post an event'
    if (panelLede) {
      panelLede.textContent = 'Add a new campus event — saved to the database.'
    }
    if (submitLabel) submitLabel.textContent = 'Post event'
    setFormError('')
  }

  /**
   * @param {Record<string, unknown>} apiEvent
   */
  function prefillForEdit(apiEvent) {
    setFormError('')
    const id = String(apiEvent.id ?? '')
    if (editingIdInput) editingIdInput.value = id
    const existingUrl = String(apiEvent.imageUrl ?? '').trim()
    if (existingImageInput) existingImageInput.value = existingUrl

    const titleIn = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-title-input'))
    const catIn = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-category-input'))
    const locIn = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-location-input'))
    const descIn = /** @type {HTMLTextAreaElement | null} */ (document.querySelector('#post-desc-input'))
    const dateIn = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-date-input'))
    const timeIn = /** @type {HTMLInputElement | null} */ (document.querySelector('#post-time-input'))

    if (titleIn) titleIn.value = String(apiEvent.title ?? '')
    if (catIn) catIn.value = String(apiEvent.category ?? '')
    if (locIn) locIn.value = String(apiEvent.location ?? '')
    if (descIn) descIn.value = String(apiEvent.description ?? '')

    const startsAt = apiEvent.startsAt ? String(apiEvent.startsAt) : ''
    if (startsAt && dateIn && timeIn) {
      dateIn.value = isoToDateInput(startsAt)
      timeIn.value = isoToTimeInput(startsAt)
    }

    const isFree = apiEvent.isFree !== false && !(Number(apiEvent.price) > 0)
    ticketRadios.forEach((r) => {
      r.checked = isFree ? r.value === 'free' : r.value === 'paid'
    })
    syncPriceFieldVisibility()
    if (!isFree && priceInput) {
      priceInput.value = String(Number(apiEvent.price) || '')
    }

    imageDataUrl = ''
    if (fileInput) fileInput.value = ''
    if (existingUrl && previewImg && previewWrap) {
      previewImg.src = existingUrl
      previewImg.alt = String(apiEvent.title ?? 'Event')
      previewWrap.hidden = false
    } else {
      clearImage()
      if (existingImageInput) existingImageInput.value = existingUrl
    }

    if (panelTitle) panelTitle.textContent = 'Edit event'
    if (panelLede) {
      panelLede.textContent = 'Update this listing, then save changes.'
    }
    if (submitLabel) submitLabel.textContent = 'Save changes'
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
      if (existingImageInput) existingImageInput.value = ''
    }
    reader.readAsDataURL(file)
  })

  removeBtn?.addEventListener('click', () => {
    clearImage()
    if (existingImageInput) existingImageInput.value = ''
  })

  cancelBtn?.addEventListener('click', () => {
    resetToCreate()
    onCancel?.()
  })

  if (!form) return { resetToCreate, prefillForEdit }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setFormError('')

    const fd = new FormData(form)
    const ticketType = String(fd.get('ticketType') || 'free')
    const isFree = ticketType !== 'paid'
    const rawPrice = String(fd.get('price') || '').trim()
    const parsedPrice = Number(rawPrice)
    const price = isFree || !rawPrice || Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice)

    const existingImg = String(existingImageInput?.value ?? '').trim()
    const pickedUrl = imageDataUrl || existingImg

    const values = {
      title: String(fd.get('title') || '').trim(),
      category: String(fd.get('category') || '').trim(),
      date: String(fd.get('date') || '').trim(),
      time: String(fd.get('time') || '').trim(),
      location: String(fd.get('location') || '').trim(),
      description: String(fd.get('description') || '').trim(),
      imageUrl: pickedUrl,
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

    const isEditingPost = Boolean(document.querySelector('#post-editing-id')?.value?.trim())
    if (submitBtn) submitBtn.disabled = true
    if (submitSpinner) submitSpinner.hidden = false
    if (formOverlay) {
      formOverlay.hidden = false
      if (formOverlayText) formOverlayText.textContent = isEditingPost ? 'Saving changes…' : 'Posting event…'
    }
    if (form) form.classList.add('post-form--submitting')
    if (submitLabel) submitLabel.textContent = isEditingPost ? 'Saving…' : 'Posting…'

    try {
      await Promise.resolve(onSubmit(values, form))
      resetToCreate()
      clearImage()
      syncPriceFieldVisibility()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setFormError(msg)
    } finally {
      if (submitBtn) submitBtn.disabled = false
      if (submitSpinner) submitSpinner.hidden = true
      if (formOverlay) formOverlay.hidden = true
      if (form) form.classList.remove('post-form--submitting')
      if (submitLabel) submitLabel.textContent = isEditingPost ? 'Save changes' : 'Post event'
    }
  })

  return { resetToCreate, prefillForEdit }
}
