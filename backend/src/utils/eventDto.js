/** Stock photos when `imageUrl` is missing — keeps list/detail cards visual per category. */
const CATEGORY_DEFAULT_IMAGES = {
  Technology: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  Music: 'https://images.unsplash.com/photo-1415201361194-42cacf7e5046?w=800&q=80',
  Career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
  Arts: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  Networking: 'https://images.unsplash.com/photo-1517245386807-bb43f65c33c4?w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80',
}

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'

function resolveImageUrl(doc) {
  const raw = String(doc.imageUrl ?? '').trim()
  if (raw) return raw
  const cat = String(doc.category ?? '').trim()
  return CATEGORY_DEFAULT_IMAGES[cat] || DEFAULT_EVENT_IMAGE
}

export function formatDateLabel(startsAt) {
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

export function toListItem(doc) {
  const price = Number(doc.price) || 0
  const isFree = doc.isFree !== false && !(price > 0)
  const startsAt = doc.startsAt ? new Date(doc.startsAt).toISOString() : undefined
  const creatorId =
    doc.createdBy != null
      ? typeof doc.createdBy === 'object' && doc.createdBy && '_id' in doc.createdBy
        ? String(doc.createdBy._id)
        : String(doc.createdBy)
      : null
  return {
    id: String(doc._id),
    title: doc.title,
    dateLabel: formatDateLabel(doc.startsAt),
    startsAt,
    location: doc.location,
    category: doc.category,
    description: doc.description,
    imageUrl: resolveImageUrl(doc),
    isFree,
    price: isFree ? 0 : price,
    creatorId,
  }
}

export function toDetailItem(doc) {
  const base = toListItem(doc)
  const creator = doc.createdBy
  if (creator && typeof creator === 'object' && '_id' in creator) {
    return {
      ...base,
      creator: {
        id: String(creator._id),
        name: creator.name,
        email: creator.email,
      },
    }
  }
  return { ...base, creator: null }
}
