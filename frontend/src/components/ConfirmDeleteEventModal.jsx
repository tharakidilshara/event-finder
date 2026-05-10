import { useEffect } from 'react'

/**
 * @param {{
 *   open: boolean,
 *   eventTitle: string,
 *   busy: boolean,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }} props
 */
export default function ConfirmDeleteEventModal({ open, eventTitle, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="modal modal--confirm-delete" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="modal__backdrop" onClick={() => !busy && onCancel()} aria-hidden="true" />
      <div className="modal__panel modal__panel--narrow confirm-delete-modal__panel" role="document">
        <h2 id="confirm-delete-title" className="confirm-delete-modal__title">
          Delete this event?
        </h2>
        <p className="confirm-delete-modal__text">
          <strong className="confirm-delete-modal__event-name">{eventTitle}</strong> will be removed for everyone. Saved
          bookmarks for this event will be cleared. This cannot be undone.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--ghost modal__delete" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete event'}
          </button>
        </div>
      </div>
    </div>
  )
}
