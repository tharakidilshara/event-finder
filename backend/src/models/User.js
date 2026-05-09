import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    /** bcrypt hash; absent for legacy users until they set a password via register. */
    passwordHash: { type: String, select: false, default: null },
  },
  { timestamps: true },
)

userSchema.index({ email: 1 }, { unique: true })

export const User = mongoose.model('User', userSchema)
