import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { HttpError } from '../middleware/httpError.js'
import { signUserToken } from '../utils/authToken.js'

function assertJwtConfigured() {
  if (!String(process.env.JWT_SECRET ?? '').trim()) {
    throw new HttpError(
      500,
      'Sign-in is not configured on the server (missing JWT_SECRET in backend/.env). Restart the API after adding it.',
    )
  }
}

function toPublicUser(doc) {
  return { id: String(doc._id), name: doc.name, email: doc.email }
}

/** POST /api/auth/register */
export async function register(req, res) {
  assertJwtConfigured()
  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!name || name.length > 120) {
    throw new HttpError(400, 'name is required (max 120 characters)')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Valid email is required')
  }
  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  let user
  try {
    user = await User.create({ name, email, passwordHash })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      throw new HttpError(409, 'An account with this email already exists')
    }
    throw err
  }

  const token = signUserToken({ id: String(user._id), email: user.email })
  res.status(201).json({ token, user: toPublicUser(user) })
}

/** POST /api/auth/login */
export async function login(req, res) {
  assertJwtConfigured()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email }).select('+passwordHash').lean()
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Invalid email or password')
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const token = signUserToken({ id: String(user._id), email: user.email })
  res.json({
    token,
    user: { id: String(user._id), name: user.name, email: user.email },
  })
}

/** GET /api/auth/me */
export async function me(req, res) {
  assertJwtConfigured()
  const hdr = req.headers.authorization
  if (!hdr?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Not authenticated')
  }
  const token = hdr.slice(7).trim()
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new HttpError(401, 'Invalid or expired session')
  }
  const id = typeof payload === 'object' && payload && 'sub' in payload ? String(payload.sub) : ''
  const user = await User.findById(id).lean()
  if (!user) {
    throw new HttpError(401, 'User no longer exists')
  }
  res.json({ user: toPublicUser(user) })
}
