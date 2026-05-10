import { useEffect } from 'react'

function formatPrice(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n <= 0) return '$0'
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

/**
 * @param {{
 *   open: boolean,
 *   event: object | null,
 *   fetchLoading: boolean,
 *   isSaved: boolean,
 *   canManage: boolean,
 *   onClose: () => void,
 *   onToggleSave: () => void,
 *   onEdit: () => void,
 *   onDelete: () => void,
 *   onRegister: () => void,
 *   actionsDisabled: boolean,
 * }} props
 */
export default function EventDetailModal({
  open,
  event,
  fetchLoading,
  isSaved,
  canManage,
  onClose,
  onToggleSave,
  onEdit,
  onDelete,
  onRegister,
  actionsDisabled,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const reg = document.querySelector('#register-ticket-modal')
      if (reg && !reg.hidden) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isFree = event ? event.isFree !== false && !(Number(event.price) > 0) : true
  const price = event && Number(event.price) > 0 ? Number(event.price) : 0

  return (
    <div className="modal" id="event-detail-modal" role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
      <div className="modal__backdrop" data-action="close-detail" onClick={onClose} />
      <div className="modal__panel" role="document">
        <button type="button" className="modal__close" data-action="close-detail" aria-label="Close details" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div className="modal__panel-main">
          <div className="modal__fetch-overlay" id="event-detail-loading" hidden={!fetchLoading} aria-hidden={!fetchLoading}>
            <span className="loading-spinner loading-spinner--lg" aria-hidden="true" />
            <p className="modal__fetch-text">Loading event…</p>
          </div>
          {event && (
            <>
              <div className="modal__media">
                {event.imageUrl ? (
                  <img className="modal__image" id="event-detail-image" src={event.imageUrl} alt={event.title} />
                ) : (
                  <p className="modal__no-image" id="event-detail-no-image">
                    No photo provided
                  </p>
                )}
              </div>
              <div className="modal__content">
                <div className="modal__chips">
                  <span className="event-card__category" id="event-detail-category">
                    {event.category}
                  </span>
                  <span className={`modal__price-badge ${isFree ? 'modal__price-badge--free' : 'modal__price-badge--paid'}`} id="event-detail-price">
                    {isFree ? 'Free' : formatPrice(price)}
                  </span>
                </div>
                <h2 className="modal__title" id="event-detail-title">
                  {event.title}
                </h2>
                <p className="modal__when" id="event-detail-when">
                  {event.dateLabel}
                </p>
                <p className="modal__where" id="event-detail-where">
                  {event.location}
                </p>
                <p className="modal__desc" id="event-detail-desc">
                  {event.description}
                </p>
                {event.creator?.name && (
                  <p className="modal__organizer" id="event-detail-organizer">
                    Hosted by {event.creator.name}
                  </p>
                )}
                <div className="modal__actions modal__actions--wrap">
                  <button type="button" className="btn btn--ghost" data-action="close-detail" onClick={onClose}>
                    Close
                  </button>
                  <button type="button" className={`btn btn--ghost modal__save ${isSaved ? 'modal__save--active' : ''}`} id="event-detail-save" aria-pressed={isSaved} onClick={onToggleSave} disabled={actionsDisabled}>
                    <span className="modal__save-label">{isSaved ? 'Saved' : 'Save event'}</span>
                  </button>
                  <button type="button" className="btn btn--ghost" data-action="edit-event" hidden={!canManage} onClick={onEdit} disabled={actionsDisabled}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost modal__delete" data-action="delete-event" hidden={!canManage} onClick={onDelete} disabled={actionsDisabled}>
                    Delete
                  </button>
                  <button type="button" className={`btn btn--primary modal__buy ${isFree ? 'modal__buy--free' : 'modal__buy--paid'}`} id="event-detail-buy" onClick={onRegister} disabled={actionsDisabled}>
                    <span className="modal__buy-label">{isFree ? 'Register · Free' : `Buy ticket · ${formatPrice(price)}`}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
