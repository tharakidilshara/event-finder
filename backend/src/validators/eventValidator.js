import mongoose from 'mongoose'
import { HttpError } from '../middleware/httpError.js'

/**
 * @param {unknown} body
 * @returns {{
 *   title: string,
 *   category: string,
 *   description: string,
 *   location: string,
 *   startsAt: Date,
 *   imageUrl: string,
 *   isFree: boolean,
 *   price: number,
 *   createdBy: import('mongoose').Types.ObjectId | null,
 * }}
 */
export function assertValidCreateEvent(body) {
  const title = String(body?.title ?? '').trim()
  const category = String(body?.category ?? '').trim()
  const description = String(body?.description ?? '').trim()
  const location = String(body?.location ?? '').trim()
  const imageUrl = String(body?.imageUrl ?? '').trim()

  if (!title || title.length > 200) {
    throw new HttpError(400, 'title is required and must be at most 200 characters')
  }
  if (!category) {
    throw new HttpError(400, 'category is required')
  }
  if (!description || description.length < 3) {
    throw new HttpError(400, 'description is required (min 3 characters)')
  }
  if (!location) {
    throw new HttpError(400, 'location is required')
  }

  let startsAt
  if (body?.startsAt != null && String(body.startsAt).trim() !== '') {
    const d = new Date(String(body.startsAt))
    if (Number.isNaN(d.getTime())) {
      throw new HttpError(400, 'startsAt must be a valid date')
    }
    startsAt = d
  } else {
    const date = String(body?.date ?? '').trim()
    const time = String(body?.time ?? '').trim()
    if (!date || !time) {
      throw new HttpError(400, 'Provide startsAt or both date and time (YYYY-MM-DD and HH:mm)')
    }
    const combined = `${date}T${time.length === 5 ? `${time}:00` : time}`
    const d = new Date(combined)
    if (Number.isNaN(d.getTime())) {
      throw new HttpError(400, 'date and time must form a valid datetime')
    }
    startsAt = d
  }

  const isFree = body?.isFree !== false && body?.ticketType !== 'paid'
  const rawPrice = body?.price
  const priceNum = rawPrice === undefined || rawPrice === '' ? 0 : Number(rawPrice)
  if (Number.isNaN(priceNum) || priceNum < 0) {
    throw new HttpError(400, 'price must be a number >= 0')
  }
  if (!isFree && !(priceNum > 0)) {
    throw new HttpError(400, 'Paid events must have price greater than 0')
  }

  let createdBy = null
  const creatorId = body?.createdBy
  if (creatorId != null && String(creatorId).trim() !== '') {
    if (!mongoose.Types.ObjectId.isValid(String(creatorId))) {
      throw new HttpError(400, 'createdBy must be a valid user id')
    }
    createdBy = new mongoose.Types.ObjectId(String(creatorId))
  }

  return {
    title,
    category,
    description,
    location,
    startsAt,
    imageUrl,
    isFree,
    price: isFree ? 0 : priceNum,
    createdBy,
  }
}

/**
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
export function assertValidPatchEvent(body) {
  if (body == null || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }

  /** @type {Record<string, unknown>} */
  const patch = {}

  if ('title' in body) {
    const title = String(body.title ?? '').trim()
    if (!title || title.length > 200) {
      throw new HttpError(400, 'title must be 1–200 characters')
    }
    patch.title = title
  }

  if ('category' in body) {
    const category = String(body.category ?? '').trim()
    if (!category) throw new HttpError(400, 'category cannot be empty')
    patch.category = category
  }

  if ('description' in body) {
    const description = String(body.description ?? '').trim()
    if (description.length < 3) {
      throw new HttpError(400, 'description must be at least 3 characters')
    }
    patch.description = description
  }

  if ('location' in body) {
    const location = String(body.location ?? '').trim()
    if (!location) throw new HttpError(400, 'location cannot be empty')
    patch.location = location
  }

  if (
    'startsAt' in body &&
    body.startsAt != null &&
    String(body.startsAt).trim() !== ''
  ) {
    const d = new Date(String(body.startsAt))
    if (Number.isNaN(d.getTime())) {
      throw new HttpError(400, 'startsAt must be a valid date')
    }
    patch.startsAt = d
  } else {
    if ('date' in body || 'time' in body) {
      const date = String(body.date ?? '').trim()
      const time = String(body.time ?? '').trim()
      if (!date || !time) {
        throw new HttpError(400, 'When updating date, provide both date and time')
      }
      const combined = `${date}T${time.length === 5 ? `${time}:00` : time}`
      const d = new Date(combined)
      if (Number.isNaN(d.getTime())) {
        throw new HttpError(400, 'date and time must form a valid datetime')
      }
      patch.startsAt = d
    }
  }

  if ('imageUrl' in body) {
    patch.imageUrl = String(body.imageUrl ?? '').trim()
  }

  if ('isFree' in body) {
    patch.isFree = body.isFree !== false
  }

  if ('price' in body) {
    const priceNum = Number(body.price)
    if (Number.isNaN(priceNum) || priceNum < 0) {
      throw new HttpError(400, 'price must be a number >= 0')
    }
    patch.price = priceNum
  }

  if ('createdBy' in body) {
    const creatorId = body.createdBy
    if (creatorId == null || String(creatorId).trim() === '') {
      patch.createdBy = null
    } else if (!mongoose.Types.ObjectId.isValid(String(creatorId))) {
      throw new HttpError(400, 'createdBy must be a valid user id')
    } else {
      patch.createdBy = new mongoose.Types.ObjectId(String(creatorId))
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'No valid fields to update')
  }

  return patch
}
