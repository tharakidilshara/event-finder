import { Event } from '../models/Event.js'

function formatDateLabel(startsAt) {
  if (!startsAt) return 'TBA'
  const d = new Date(startsAt)
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart} · ${timePart}`
}

function toListItem(doc) {
  const price = Number(doc.price) || 0
  const isFree = doc.isFree !== false && !(price > 0)
  return {
    id: String(doc._id),
    title: doc.title,
    dateLabel: formatDateLabel(doc.startsAt),
    location: doc.location,
    category: doc.category,
    description: doc.description,
    imageUrl: doc.imageUrl || '',
    isFree,
    price: isFree ? 0 : price,
  }
}

/** GET /api/events */
export async function listEvents(_req, res) {
  try {
    const docs = await Event.find().sort({ startsAt: 1 }).lean()
    res.json(docs.map(toListItem))
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: { message: 'Failed to load events' },
    })
  }
}
