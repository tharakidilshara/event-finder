import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { SavedBookmark } from '../models/SavedBookmark.js'
import { HttpError } from '../middleware/httpError.js'
import { toListItem } from '../utils/eventDto.js'

function assertObjectId(id, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new HttpError(400, `Invalid ${label}`)
  }
}

/** GET /api/saved-events — current user's saved events (populate Event). */
export async function listSaved(req, res) {
  const userId = /** @type {{ id: string }} */ (req.user).id
  const docs = await SavedBookmark.find({ user: userId })
    .populate('event')
    .sort({ createdAt: -1 })
    .lean()

  const items = []
  for (const row of docs) {
    const ev = row.event
    if (ev && typeof ev === 'object' && '_id' in ev) {
      items.push(toListItem(ev))
    }
  }
  res.json({ items })
}

/**
 * POST /api/saved-events
 * Body: { "eventId": "<ObjectId>" }
 */
export async function addSaved(req, res) {
  const userId = /** @type {{ id: string }} */ (req.user).id
  const eventId = req.body?.eventId ?? req.body?.event
  if (eventId == null || String(eventId).trim() === '') {
    throw new HttpError(400, 'eventId is required')
  }
  assertObjectId(eventId, 'event id')

  const exists = await Event.findById(eventId).select('_id').lean()
  if (!exists) {
    throw new HttpError(404, 'Event not found')
  }

  try {
    await SavedBookmark.create({ user: userId, event: eventId })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      throw new HttpError(409, 'Event is already in your saved list')
    }
    throw err
  }
  res.status(201).json({ ok: true, eventId: String(eventId) })
}

/** DELETE /api/saved-events/:eventId */
export async function removeSaved(req, res) {
  const userId = /** @type {{ id: string }} */ (req.user).id
  const { eventId } = req.params
  assertObjectId(eventId, 'event id')

  const result = await SavedBookmark.deleteOne({ user: userId, event: eventId })
  if (result.deletedCount === 0) {
    throw new HttpError(404, 'Saved entry not found')
  }
  res.status(204).send()
}
