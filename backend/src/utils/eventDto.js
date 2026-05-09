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
  return {
    id: String(doc._id),
    title: doc.title,
    dateLabel: formatDateLabel(doc.startsAt),
    startsAt,
    location: doc.location,
    category: doc.category,
    description: doc.description,
    imageUrl: doc.imageUrl || '',
    isFree,
    price: isFree ? 0 : price,
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
