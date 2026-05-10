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

/**
 * @typedef {{ items: object[], total: number, limit: number, skip: number, hasMore: boolean }} EventsPage
 */

/**
 * @param {{ q?: string, signal?: AbortSignal, limit?: number, skip?: number } | string} [opts] - string shorthand `{ q }`
 * @returns {Promise<EventsPage>}
 */
export async function fetchEvents(opts) {
  const o = typeof opts === 'string' ? { q: opts } : opts ?? {}
  const q = typeof o.q === 'string' ? o.q.trim() : ''
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (o.limit != null) params.set('limit', String(o.limit))
  if (o.skip != null) params.set('skip', String(o.skip))
  const qs = params.toString()
  const url = `${API_BASE}/api/events${qs ? `?${qs}` : ''}`
  const res = await fetch(url, { signal: o.signal })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  const data = await res.json()
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: typeof data.total === 'number' ? data.total : data.items.length,
      limit: typeof data.limit === 'number' ? data.limit : data.items.length,
      skip: typeof data.skip === 'number' ? data.skip : 0,
      hasMore: Boolean(data.hasMore),
    }
  }
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: data.length,
      skip: 0,
      hasMore: false,
    }
  }
  throw new Error('Invalid response from server')
}

/**
 * @param {string} userId
 * @returns {Promise<{ user: { id: string, name: string, email: string }, events: object[] }>}
 */
export async function fetchEventsByUser(userId) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(userId)}/events`)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/** @returns {Promise<object>} */
export async function fetchEventById(id) {
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/**
 * @param {{
 *   title: string,
 *   category: string,
 *   description: string,
 *   location: string,
 *   date: string,
 *   time: string,
 *   imageUrl?: string,
 *   isFree: boolean,
 *   price: number,
 * }} payload
 */
export async function createEvent(payload) {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      location: payload.location,
      date: payload.date,
      time: payload.time,
      imageUrl: payload.imageUrl || undefined,
      isFree: payload.isFree,
      ticketType: payload.isFree ? 'free' : 'paid',
      price: payload.price,
    }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function patchEvent(id, patch) {
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

/** @param {string} id */
export async function deleteEvent(id) {
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (res.status === 204) return
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
}
