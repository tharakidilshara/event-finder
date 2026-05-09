import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { User } from '../models/User.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

/** @param {Date} d @param {number} days */
function addDays(d, days) {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

const SEED_EVENT_TITLES = [
  'Campus Tech Meetup 2026',
  'Jazz Night at Union Hall',
  'Spring Career Fair',
  'Intro to Pottery Workshop',
  'Alumni Networking Breakfast',
  'Charity 5K Run for Libraries',
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI. Set it in backend/.env (see .env.example).')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  const organizer = await User.findOneAndUpdate(
    { email: 'demo.organizer@eventfinder.example' },
    { $setOnInsert: { name: 'Demo Organizer', email: 'demo.organizer@eventfinder.example' } },
    { upsert: true, new: true },
  )

  const base = new Date()
  const events = [
    {
      title: SEED_EVENT_TITLES[0],
      category: 'Technology',
      description:
        'Lightning talks, student demos, and networking for anyone building apps, hardware, or research prototypes. Pizza provided.',
      location: 'Engineering Building, Room 204',
      startsAt: addDays(base, 7),
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      isFree: true,
      price: 0,
      createdBy: organizer._id,
    },
    {
      title: SEED_EVENT_TITLES[1],
      category: 'Music',
      description:
        'An evening of live jazz with the campus big band and guest soloists. Doors open 30 minutes before showtime.',
      location: 'Student Union Hall',
      startsAt: addDays(base, 10),
      imageUrl:
        'https://images.unsplash.com/photo-1415201361194-42cacf7e5046?w=800&q=80',
      isFree: false,
      price: 12,
      createdBy: organizer._id,
    },
    {
      title: SEED_EVENT_TITLES[2],
      category: 'Career',
      description:
        'Meet employers from tech, healthcare, and public sector. Bring resumes; on-site resume reviews at booth 12.',
      location: 'Sports Arena, Main Floor',
      startsAt: addDays(base, 14),
      imageUrl:
        'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
      isFree: true,
      price: 0,
      createdBy: organizer._id,
    },
    {
      title: SEED_EVENT_TITLES[3],
      category: 'Arts',
      description:
        'Hands-on wheel throwing and glazing basics. Materials included; wear clothes you can get clay on.',
      location: 'Fine Arts Studio B',
      startsAt: addDays(base, 21),
      imageUrl:
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
      isFree: false,
      price: 35,
      createdBy: organizer._id,
    },
    {
      title: SEED_EVENT_TITLES[4],
      category: 'Networking',
      description:
        'Casual breakfast with alumni from five decades. RSVP appreciated for catering numbers.',
      location: 'Alumni Center Patio',
      startsAt: addDays(base, 5),
      imageUrl:
        'https://images.unsplash.com/photo-1517245386807-bb43f65c33c4?w=800&q=80',
      isFree: true,
      price: 0,
      createdBy: organizer._id,
    },
    {
      title: SEED_EVENT_TITLES[5],
      category: 'Sports',
      description:
        'Chip-timed 5K on campus trails; proceeds support the library renovation fund. Medals for top three age groups.',
      location: 'Campus Loop, Start at Clock Tower',
      startsAt: addDays(base, 28),
      imageUrl:
        'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80',
      isFree: true,
      price: 0,
      createdBy: organizer._id,
    },
  ]

  const removed = await Event.deleteMany({ title: { $in: SEED_EVENT_TITLES } })
  if (removed.deletedCount > 0) {
    console.log(`Removed ${removed.deletedCount} previous seed event(s) with matching titles.`)
  }

  const inserted = await Event.insertMany(events)
  console.log(`Inserted ${inserted.length} example events.`)
  console.log('Demo user (organizer):', organizer.email, '→', String(organizer._id))

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
