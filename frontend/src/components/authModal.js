import { login, register, setSession } from '../api/auth.js'

/** @type {(() => void) | null} */
let pendingOnSuccess = null

/** @type {(() => void) | null} */
let onSessionChange = null

/**
 * @returns {string}
 */
export function getAuthModalMarkup() {
  return `
    <div class="modal modal--auth" id="auth-modal" hidden role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div class="modal__backdrop" data-auth-action="close"></div>
      <div class="modal__panel modal__panel--narrow" role="document">
        <button type="button" class="modal__close" data-auth-action="close" aria-label="Close">×</button>
        <h2 id="auth-modal-title" class="auth-modal__title">Sign in to add events</h2>
        <p class="auth-modal__lede">Browsing and booking stay open to everyone.</p>
        <p class="auth-modal__error" id="auth-modal-error" hidden role="alert"></p>
        <form class="auth-modal__form" id="auth-modal-form">
          <div class="auth-modal__field" id="auth-field-name" hidden>
            <label class="auth-modal__label" for="auth-name">Name</label>
            <input class="auth-modal__input" id="auth-name" name="name" type="text" autocomplete="name" maxlength="120" />
          </div>
          <div class="auth-modal__field">
            <label class="auth-modal__label" for="auth-email">Email</label>
            <input class="auth-modal__input" id="auth-email" name="email" type="email" required autocomplete="email" />
          </div>
          <div class="auth-modal__field">
            <label class="auth-modal__label" for="auth-password">Password</label>
            <input class="auth-modal__input" id="auth-password" name="password" type="password" required minlength="8" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn--primary auth-modal__submit" id="auth-submit-btn">Sign in</button>
        </form>
        <p class="auth-modal__switch">
          <button type="button" class="auth-modal__link-btn" id="auth-switch-mode">Create an account</button>
        </p>
      </div>
    </div>
  `
}

function setAuthError(msg) {
  const el = document.querySelector('#auth-modal-error')
  if (!el) return
  if (msg) {
    el.textContent = msg
    el.hidden = false
  } else {
    el.textContent = ''
    el.hidden = true
  }
}

function closeAuthModal() {
  const modal = document.querySelector('#auth-modal')
  if (!modal) return
  modal.hidden = true
  document.body.classList.remove('modal-open')
  setAuthError('')
  pendingOnSuccess = null
}

/** @param {'login' | 'register'} mode */
function setAuthMode(mode) {
  const title = document.querySelector('#auth-modal-title')
  const nameField = document.querySelector('#auth-field-name')
  const submit = document.querySelector('#auth-submit-btn')
  const switchBtn = document.querySelector('#auth-switch-mode')
  const pw = /** @type {HTMLInputElement | null} */ (document.querySelector('#auth-password'))
  if (!title || !nameField || !submit || !switchBtn) return
  const isRegister = mode === 'register'
  title.textContent = isRegister ? 'Create an account' : 'Sign in to add events'
  nameField.hidden = !isRegister
  const nameInput = /** @type {HTMLInputElement | null} */ (document.querySelector('#auth-name'))
  if (nameInput) {
    nameInput.disabled = !isRegister
    if (!isRegister) nameInput.value = ''
  }
  submit.textContent = isRegister ? 'Create account' : 'Sign in'
  switchBtn.textContent = isRegister ? 'Already have an account? Sign in' : 'Create an account'
  switchBtn.dataset.mode = isRegister ? 'login' : 'register'
  if (pw) pw.autocomplete = isRegister ? 'new-password' : 'current-password'
}

/**
 * @param {{ onSessionChange?: () => void }} [opts]
 */
export function initAuthModal(opts = {}) {
  onSessionChange = opts.onSessionChange ?? null
  const modal = document.querySelector('#auth-modal')
  if (!modal) return

  modal.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement | null} */ (e.target)
    if (t?.closest('[data-auth-action="close"]')) {
      closeAuthModal()
    }
  })

  document.querySelector('#auth-switch-mode')?.addEventListener('click', (e) => {
    const btn = /** @type {HTMLButtonElement} */ (e.currentTarget)
    const next = btn.dataset.mode === 'register' ? 'register' : 'login'
    setAuthMode(next)
    setAuthError('')
  })

  document.querySelector('#auth-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = /** @type {HTMLFormElement} */ (e.currentTarget)
    const submitBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('#auth-submit-btn'))
    const email = /** @type {HTMLInputElement | null} */ (document.querySelector('#auth-email'))
    const password = /** @type {HTMLInputElement | null} */ (document.querySelector('#auth-password'))
    const name = /** @type {HTMLInputElement | null} */ (document.querySelector('#auth-name'))
    if (!email || !password || !submitBtn) return

    const isRegister = !(document.querySelector('#auth-field-name')?.hidden)
    setAuthError('')
    submitBtn.disabled = true
    try {
      if (isRegister) {
        const nm = name?.value?.trim() ?? ''
        if (!nm) {
          setAuthError('Name is required.')
          return
        }
        const { token, user } = await register({
          name: nm,
          email: email.value.trim(),
          password: password.value,
        })
        setSession(token, user)
      } else {
        const { token, user } = await login(email.value.trim(), password.value)
        setSession(token, user)
      }
      onSessionChange?.()
      const done = pendingOnSuccess
      closeAuthModal()
      done?.()
      form.reset()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      submitBtn.disabled = false
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || modal.hidden) return
    closeAuthModal()
  })
}

/**
 * @param {{ onSuccess?: () => void, startInRegister?: boolean }} [opts]
 */
export function openAuthModal(opts = {}) {
  pendingOnSuccess = opts.onSuccess ?? null
  const modal = document.querySelector('#auth-modal')
  if (!modal) return
  setAuthMode(opts.startInRegister ? 'register' : 'login')
  setAuthError('')
  modal.hidden = false
  document.body.classList.add('modal-open')
  /** @type {HTMLInputElement | null} */
  const focusEl = opts.startInRegister
    ? document.querySelector('#auth-name')
    : document.querySelector('#auth-email')
  focusEl?.focus()
}

export { closeAuthModal }
