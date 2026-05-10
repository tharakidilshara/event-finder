import { useCallback, useEffect, useState } from 'react'
import { createEvent, patchEvent } from '../api/events.js'

function isoToDateInput(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isoToTimeInput(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Controlled create/edit event form (DA219B).
 * @param {{
 *   onDone: () => void,
 *   onCancel: () => void,
 *   editEvent: object | null,
 *   onClearEdit: () => void,
 * }} props
 */
export default function PostEventForm({ onDone, onCancel, editEvent, onClearEdit }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [ticketType, setTicketType] = useState('free')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [editingId, setEditingId] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const resetToCreate = useCallback(() => {
    setEditingId('')
    setTitle('')
    setCategory('')
    setDate('')
    setTime('')
    setLocation('')
    setDescription('')
    setTicketType('free')
    setPrice('')
    setImageUrl('')
    setImagePreview('')
    setFormError('')
    onClearEdit()
  }, [onClearEdit])

  useEffect(() => {
    if (!editEvent) return
    setFormError('')
    setEditingId(String(editEvent.id ?? ''))
    setTitle(String(editEvent.title ?? ''))
    setCategory(String(editEvent.category ?? ''))
    setLocation(String(editEvent.location ?? ''))
    setDescription(String(editEvent.description ?? ''))
    const startsAt = editEvent.startsAt ? String(editEvent.startsAt) : ''
    if (startsAt) {
      setDate(isoToDateInput(startsAt))
      setTime(isoToTimeInput(startsAt))
    }
    const isFree = editEvent.isFree !== false && !(Number(editEvent.price) > 0)
    setTicketType(isFree ? 'free' : 'paid')
    setPrice(isFree ? '' : String(Number(editEvent.price) || ''))
    const url = String(editEvent.imageUrl ?? '').trim()
    setImageUrl(url)
    setImagePreview(url)
  }, [editEvent])

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    const isFree = ticketType !== 'paid'
    const parsedPrice = Number(String(price).trim())
    const p = isFree || !price.trim() || Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice)
    if (!title.trim() || !category.trim() || !date || !time || !location.trim() || !description.trim()) return
    if (!isFree && !(p > 0)) return
    setBusy(true)
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        location: location.trim(),
        date,
        time,
        imageUrl: imagePreview || imageUrl || undefined,
        isFree,
        price: p,
      }
      if (editingId) {
        await patchEvent(editingId, payload)
      } else {
        await createEvent(payload)
      }
      resetToCreate()
      onDone()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setImagePreview('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const isPaid = ticketType === 'paid'
  const isEditing = Boolean(editingId)

  return (
    <section className="post-panel" aria-labelledby="post-title">
      <h2 id="post-title" className="saved-panel__title">
        {isEditing ? 'Edit event' : 'Post an event'}
      </h2>
      <p className="saved-panel__lede" id="post-panel-lede">
        {isEditing ? 'Update this listing, then save changes.' : 'Add a new event.'}
      </p>

      <div className="post-form-stack">
        <form id="post-event-form" className="post-form" onSubmit={onSubmit}>
          <p className="post-form__error" id="post-form-error" hidden={!formError} role="alert">
            {formError}
          </p>

          <div className="post-form__grid">
            <div className="post-form__field">
              <label className="post-form__label" htmlFor="post-title-input">
                Title
              </label>
              <input className="post-form__input" id="post-title-input" name="title" required placeholder="e.g. Hackathon kickoff" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="post-form__field">
              <label className="post-form__label" htmlFor="post-category-input">
                Category
              </label>
              <input className="post-form__input" id="post-category-input" name="category" required placeholder="e.g. Tech" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="post-form__field">
              <label className="post-form__label" htmlFor="post-date-input">
                Date
              </label>
              <input className="post-form__input" id="post-date-input" name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="post-form__field">
              <label className="post-form__label" htmlFor="post-time-input">
                Time
              </label>
              <input className="post-form__input" id="post-time-input" name="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="post-form__field post-form__field--full">
              <label className="post-form__label" htmlFor="post-location-input">
                Location
              </label>
              <input className="post-form__input" id="post-location-input" name="location" required placeholder="e.g. Auditorium A" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="post-form__field post-form__field--full">
              <span className="post-form__label">Ticket type</span>
              <div className="post-form__radio-group" role="radiogroup" aria-label="Ticket type">
                <label className="post-form__radio">
                  <input type="radio" name="ticketType" value="free" checked={ticketType === 'free'} onChange={() => setTicketType('free')} />
                  <span className="post-form__radio-label">Free</span>
                </label>
                <label className="post-form__radio">
                  <input type="radio" name="ticketType" value="paid" checked={ticketType === 'paid'} onChange={() => setTicketType('paid')} />
                  <span className="post-form__radio-label">Paid</span>
                </label>
              </div>
            </div>
            <div className="post-form__field post-form__field--full" id="post-price-field" hidden={!isPaid}>
              <label className="post-form__label" htmlFor="post-price-input">
                Ticket price (USD)
              </label>
              <input className="post-form__input" id="post-price-input" name="price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 12.50" required={isPaid} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="post-form__field post-form__field--full">
              <label className="post-form__label" htmlFor="post-image-input">
                Photo <span className="post-form__hint">(optional)</span>
              </label>
              <input className="post-form__file" id="post-image-input" name="image" type="file" accept="image/*" onChange={onFileChange} />
              {imagePreview ? (
                <div className="post-form__preview" id="post-image-preview">
                  <img className="post-form__preview-img" id="post-image-preview-img" src={imagePreview} alt="Selected event photo preview" />
                  <button type="button" className="post-form__preview-remove" id="post-image-remove" onClick={() => { setImagePreview(''); setImageUrl('') }}>
                    Remove photo
                  </button>
                </div>
              ) : null}
            </div>
            <div className="post-form__field post-form__field--full">
              <label className="post-form__label" htmlFor="post-desc-input">
                Description
              </label>
              <textarea className="post-form__textarea" id="post-desc-input" name="description" rows={4} required placeholder="Short details about the event…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="post-form__actions">
            <button type="button" className="btn btn--ghost" id="post-cancel-btn" onClick={() => { resetToCreate(); onCancel() }}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" id="post-submit-btn" disabled={busy}>
              <span className="btn__spinner" id="post-submit-spinner" hidden={!busy} aria-hidden="true" />
              <span id="post-submit-label">{isEditing ? 'Save changes' : 'Post event'}</span>
            </button>
          </div>
        </form>

        <div className="post-form__overlay" id="post-form-overlay" hidden={!busy} aria-hidden={!busy}>
          <span className="loading-spinner loading-spinner--lg loading-spinner--on-elevated" aria-hidden="true" />
          <p className="post-form__overlay-text" id="post-form-overlay-text">
            {isEditing ? 'Saving changes…' : 'Posting event…'}
          </p>
        </div>
      </div>
    </section>
  )
}
