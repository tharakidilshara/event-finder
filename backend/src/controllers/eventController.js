import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { User } from '../models/User.js'
import { SavedBookmark } from '../models/SavedBookmark.js'
import { HttpError } from '../middleware/httpError.js'
import { assertValidCreateEvent, assertValidPatchEvent } from '../validators/eventValidator.js'
import { toDetailItem, toListItem } from '../utils/eventDto.js'

function assertObjectId(id, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new HttpError(400, `Invalid ${label}`)
  }
}

const SEARCH_Q_MAX = 120

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeSearchQuery(raw) {
  if (raw == null) return ''
  const s = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw)
  return s.trim().slice(0, SEARCH_Q_MAX)
}

function parsePageInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

/** GET /api/events — `?q=` search; `?limit=&skip=` pagination (default limit 5, skip 0). Sorted by soonest start time. */
export async function listEvents(req, res) {
  const q = normalizeSearchQuery(req.query.q)
  const limit = Math.min(50, Math.max(1, parsePageInt(req.query.limit, 5)))
  const skip = Math.max(0, parsePageInt(req.query.skip, 0))
  const filter =
    q.length > 0
      ? {
          $or: [
            { title: new RegExp(escapeRegex(q), 'i') },
            { description: new RegExp(escapeRegex(q), 'i') },
            { location: new RegExp(escapeRegex(q), 'i') },
            { category: new RegExp(escapeRegex(q), 'i') },
          ],
        }
      : {}
  const [total, docs] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter).sort({ startsAt: 1 }).skip(skip).limit(limit).lean(),
  ])
  res.json({
    items: docs.map(toListItem),
    total,
    limit,
    skip,
    hasMore: skip + docs.length < total,
  })
}

/** GET /api/events/:id */
export async function getEventById(req, res) {
  const { id } = req.params
  assertObjectId(id, 'event id')
  const doc = await Event.findById(id).populate('createdBy', 'name email').lean()
  if (!doc) {
    throw new HttpError(404, 'Event not found')
  }
  res.json(toDetailItem(doc))
}

/** POST /api/events — requires auth; organizer is always the signed-in user. */
export async function createEvent(req, res) {
  const payload = assertValidCreateEvent(req.body)
  const userId = /** @type {{ id: string }} */ (req.user).id
  const u = await User.findById(userId).lean()
  if (!u) {
    throw new HttpError(401, 'Your account is no longer valid')
  }
  const doc = await Event.create({
    title: payload.title,
    category: payload.category,
    description: payload.description,
    location: payload.location,
    startsAt: payload.startsAt,
    imageUrl: payload.imageUrl,
    isFree: payload.isFree,
    price: payload.price,
    createdBy: new mongoose.Types.ObjectId(userId),
  })
  const created = await Event.findById(doc._id).populate('createdBy', 'name email').lean()
  res.status(201).json(toDetailItem(created))
}

/** PATCH /api/events/:id */
export async function updateEvent(req, res) {
  const { id } = req.params
  assertObjectId(id, 'event id')
  const userId = /** @type {{ id: string }} */ (req.user).id
  const existing = await Event.findById(id).lean()
  if (!existing) {
    throw new HttpError(404, 'Event not found')
  }
  const ownerId = existing.createdBy ? String(existing.createdBy) : null
  if (!ownerId || ownerId !== userId) {
    throw new HttpError(403, 'You can only edit your own events')
  }
  const patch = assertValidPatchEvent(req.body)
  delete patch.createdBy
  const doc = await Event.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  })
    .populate('createdBy', 'name email')
    .lean()
  if (!doc) {
    throw new HttpError(404, 'Event not found')
  }
  res.json(toDetailItem(doc))
}

/** DELETE /api/events/:id */
export async function deleteEvent(req, res) {
  const { id } = req.params
  assertObjectId(id, 'event id')
  const userId = /** @type {{ id: string }} */ (req.user).id
  const existing = await Event.findById(id).lean()
  if (!existing) {
    throw new HttpError(404, 'Event not found')
  }
  const ownerId = existing.createdBy ? String(existing.createdBy) : null
  if (!ownerId || ownerId !== userId) {
    throw new HttpError(403, 'You can only delete your own events')
  }
  await SavedBookmark.deleteMany({ event: id })
  await Event.findByIdAndDelete(id).lean()
  res.status(204).send()
}
