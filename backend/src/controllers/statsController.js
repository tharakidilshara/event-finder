import { Event } from '../models/Event.js'

/** GET /api/events/stats/by-category */
export async function getEventsByCategoryStats(_req, res) {
  const rows = await Event.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
  ])
  res.json({ stats: rows })
}
