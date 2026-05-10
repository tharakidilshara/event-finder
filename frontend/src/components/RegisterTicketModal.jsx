import { useEffect, useState } from 'react'

/**
 * @param {{
 *   open: boolean,
 *   context: { eventId: string, eventTitle: string, isFree: boolean, price: number } | null,
 *   onClose: () => void,
 *   onSubmit: (payload: object) => void,
 * }} props
 */
export default function RegisterTicketModal({ open, context, onClose, onSubmit }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [ticketQty, setTicketQty] = useState('1')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setDone(false)
      setFullName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setCity('')
      setPostalCode('')
      setTicketQty('1')
      setNotes('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !context) return null

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...context,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      ticketQty: context.isFree ? 1 : Number(ticketQty) || 1,
      notes: notes.trim(),
    })
    setDone(true)
  }

  return (
    <div className="modal modal--register" id="register-ticket-modal" role="dialog" aria-modal="true" aria-labelledby="register-ticket-title">
      <div className="modal__backdrop" data-action="close-register" onClick={onClose} />
      <div className="modal__panel modal__panel--form" role="document">
        <button type="button" className="modal__close" data-action="close-register" aria-label="Close registration form" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div className="register-modal__inner">
          {!done ? (
            <div id="register-ticket-form-wrap">
              <h2 className="register-modal__title" id="register-ticket-title">
                Register for event
              </h2>
              <p className="register-modal__event" id="register-ticket-event-line">
                {context.eventTitle}
              </p>
              <p className="register-modal__mock-hint" id="register-ticket-mock-line">
                {context.isFree ? 'Free registration — mock flow only.' : `Paid · mock checkout · ${context.price}`}
              </p>
              <form id="register-ticket-form" className="post-form register-form" noValidate onSubmit={handleSubmit}>
                <div className="post-form__grid">
                  <div className="post-form__field post-form__field--full">
                    <label className="post-form__label" htmlFor="register-full-name">
                      Full name
                    </label>
                    <input className="post-form__input" id="register-full-name" name="fullName" required autoComplete="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="post-form__field post-form__field--full">
                    <label className="post-form__label" htmlFor="register-email">
                      Email
                    </label>
                    <input className="post-form__input" id="register-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="post-form__field post-form__field--full">
                    <label className="post-form__label" htmlFor="register-phone">
                      Phone <span className="post-form__hint">(optional)</span>
                    </label>
                    <input className="post-form__input" id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="e.g. +46 70 000 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="post-form__field post-form__field--full">
                    <label className="post-form__label" htmlFor="register-address">
                      Street address
                    </label>
                    <input className="post-form__input" id="register-address" name="address" required autoComplete="street-address" placeholder="Building, street" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="post-form__field">
                    <label className="post-form__label" htmlFor="register-city">
                      City
                    </label>
                    <input className="post-form__input" id="register-city" name="city" required autoComplete="address-level2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="post-form__field">
                    <label className="post-form__label" htmlFor="register-postal">
                      Postal code <span className="post-form__hint">(optional)</span>
                    </label>
                    <input className="post-form__input" id="register-postal" name="postalCode" autoComplete="postal-code" placeholder="Postal / ZIP" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                  {!context.isFree ? (
                    <div className="post-form__field post-form__field--full" id="register-tickets-field">
                      <label className="post-form__label" htmlFor="register-qty">
                        Number of tickets
                      </label>
                      <input className="post-form__input" id="register-qty" name="ticketQty" type="number" min="1" max="20" step="1" value={ticketQty} onChange={(e) => setTicketQty(e.target.value)} />
                    </div>
                  ) : null}
                  <div className="post-form__field post-form__field--full">
                    <label className="post-form__label" htmlFor="register-notes">
                      Notes <span className="post-form__hint">(optional)</span>
                    </label>
                    <textarea className="post-form__textarea" id="register-notes" name="notes" rows={3} placeholder="Allergies, accessibility, student ID…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
                <p className="register-modal__fine-print">This is a mock flow only — nothing is charged and no emails are sent.</p>
                <div className="post-form__actions">
                  <button type="button" className="btn btn--ghost" data-action="close-register" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" id="register-submit-btn">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div id="register-ticket-success" className="register-modal__success" role="status">
              <p className="register-modal__success-title">You are all set</p>
              <p className="register-modal__success-text" id="register-ticket-success-msg">
                Thanks, {fullName || 'there'} — your spot is recorded locally for the demo.
              </p>
              <button type="button" className="btn btn--primary register-modal__success-btn" data-action="close-register" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
