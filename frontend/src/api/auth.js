const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

const STORAGE_KEY = 'hittaevent_auth'

/**
 * @typedef {{ id: string, name: string, email: string }} AuthUser
 */

async function readErrorMessage(res) {
  let message = `Request failed (${res.status})`
  try {
    const body = await res.json()
    if (body?.error?.message) message = body.error.message
  } catch {
    /* ignore */
  }
  return message
}

/** @returns {string | null} */
export function getAccessToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return typeof data?.token === 'string' ? data.token : null
  } catch {
    return null
  }
}

/** @returns {AuthUser | null} */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const u = data?.user
    if (u && typeof u.id === 'string' && typeof u.email === 'string') {
      return { id: u.id, name: String(u.name ?? ''), email: u.email }
    }
    return null
  } catch {
    return null
  }
}

/** @param {string} token @param {AuthUser} user */
export function setSession(token, user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

/** @returns {Record<string, string>} */
export function authHeaders() {
  const t = getAccessToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: AuthUser }>}
 */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/**
 * @param {{ name: string, email: string, password: string }} body
 * @returns {Promise<{ token: string, user: AuthUser }>}
 */
export async function register(body) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/** @returns {Promise<AuthUser | null>} */
export async function fetchMe() {
  const token = getAccessToken()
  if (!token) return null
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    clearSession()
    return null
  }
  const data = await res.json()
  const user = data?.user
  if (user && typeof user.id === 'string') {
    setSession(token, { id: user.id, name: String(user.name ?? ''), email: user.email })
    return getStoredUser()
  }
  return null
}
