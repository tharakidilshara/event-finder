const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

/** @returns {Promise<Array<{ id: string, title: string, dateLabel: string, location: string, category: string, description: string, imageUrl?: string, isFree?: boolean, price?: number }>>} */
export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/api/events`)
  if (!res.ok) {
    let message = `Could not load events (${res.status})`
    try {
      const body = await res.json()
      if (body?.error?.message) message = body.error.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Invalid response from server')
  }
  return data
}
