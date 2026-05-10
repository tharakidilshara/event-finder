import { authHeaders } from './auth.js'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

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

/** @returns {Promise<object[]>} */
export async function fetchSavedEvents() {
  const res = await fetch(`${API_BASE}/api/saved-events`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  const data = await res.json()
  return Array.isArray(data.items) ? data.items : []
}

/** @param {string} eventId */
export async function addSavedEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/saved-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ eventId }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
}

/** @param {string} eventId */
export async function removeSavedEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/saved-events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (res.status === 204) return
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
}
