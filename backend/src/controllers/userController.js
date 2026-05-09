import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { User } from '../models/User.js'
import { HttpError } from '../middleware/httpError.js'
import { toListItem } from '../utils/eventDto.js'

/** GET /api/users/:userId/events — events created by this user (relational) */
export async function listEventsByUser(req, res) {
  const { userId } = req.params
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    throw new HttpError(400, 'Invalid user id')
  }
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new HttpError(404, 'User not found')
  }
  const docs = await Event.find({ createdBy: userId }).sort({ startsAt: 1 }).lean()
  res.json({
    user: { id: String(user._id), name: user.name, email: user.email },
    events: docs.map(toListItem),
  })
}
