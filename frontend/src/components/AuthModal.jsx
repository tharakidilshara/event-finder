import { useEffect, useState } from 'react'
import { login, register, setSession } from '../api/auth.js'

/** @typedef {{ open: boolean, startRegister?: boolean, onClose: () => void, onSuccess: () => void }} AuthModalProps */

/**
 * @param {AuthModalProps} props
 * @returns {import('react').JSX.Element | null}
 */
export default function AuthModal(props) {
  const { open, onClose, onSuccess } = props
  const startRegister = Boolean(props.startRegister)
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(startRegister ? 'register' : 'login')
      setError('')
      setPassword('')
    }
  }, [open, startRegister])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        const nm = name.trim()
        if (!nm) {
          setError('Name is required.')
          return
        }
        const { token, user } = await register({ name: nm, email: email.trim(), password })
        setSession(token, user)
      } else {
        const { token, user } = await login(email.trim(), password)
        setSession(token, user)
      }
      onSuccess()
      onClose()
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const isRegister = mode === 'register'

  return (
    <div className="modal modal--auth" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal__panel modal__panel--narrow" role="document">
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="auth-modal-title" className="auth-modal__title">
          {isRegister ? 'Create an account' : 'Sign in to add events'}
        </h2>
        <p className="auth-modal__lede">Browsing and booking stay open to everyone.</p>
        <p className="auth-modal__error" id="auth-modal-error" hidden={!error} role="alert">
          {error}
        </p>
        <form className="auth-modal__form" id="auth-modal-form" onSubmit={onSubmit}>
          <div className="auth-modal__field" id="auth-field-name" hidden={!isRegister}>
            <label className="auth-modal__label" htmlFor="auth-name">
              Name
            </label>
            <input className="auth-modal__input" id="auth-name" name="name" type="text" autoComplete="name" maxLength={120} disabled={!isRegister} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="auth-modal__field">
            <label className="auth-modal__label" htmlFor="auth-email">
              Email
            </label>
            <input className="auth-modal__input" id="auth-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="auth-modal__field">
            <label className="auth-modal__label" htmlFor="auth-password">
              Password
            </label>
            <input className="auth-modal__input" id="auth-password" name="password" type="password" required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--primary auth-modal__submit" id="auth-submit-btn" disabled={busy}>
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="auth-modal__switch">
          <button type="button" className="auth-modal__link-btn" id="auth-switch-mode" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }}>
            {isRegister ? 'Already have an account? Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}
