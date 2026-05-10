import mongoose from 'mongoose'

/**
 * Many-to-many join: which users saved which events (shortlist for later).
 * Collection name: savedbookmarks
 */
const savedBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'event is required'],
      index: true,
    },
  },
  { timestamps: true },
)

savedBookmarkSchema.index({ user: 1, event: 1 }, { unique: true })

export const SavedBookmark = mongoose.model('SavedBookmark', savedBookmarkSchema)
