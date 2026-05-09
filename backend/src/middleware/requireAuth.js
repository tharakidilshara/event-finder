import jwt from 'jsonwebtoken'
import { HttpError } from './httpError.js'

/**
 * Requires `Authorization: Bearer <jwt>`. Sets `req.user = { id: string }`.
 * @type {import('express').RequestHandler}
 */
export function requireAuth(req, _res, next) {
  const secret = String(process.env.JWT_SECRET ?? '').trim()
  if (!secret) {
    next(
      new HttpError(
        500,
        'Sign-in is not configured on the server (missing JWT_SECRET in backend/.env).',
      ),
    )
    return
  }
  const hdr = req.headers.authorization
  if (!hdr || !hdr.startsWith('Bearer ')) {
    next(new HttpError(401, 'Sign in required to manage events'))
    return
  }
  const token = hdr.slice(7).trim()
  if (!token) {
    next(new HttpError(401, 'Sign in required to manage events'))
    return
  }
  try {
    const payload = jwt.verify(token, secret)
    const sub = typeof payload === 'object' && payload && 'sub' in payload ? payload.sub : null
    if (!sub) {
      next(new HttpError(401, 'Invalid token'))
      return
    }
    req.user = { id: String(sub) }
    next()
  } catch {
    next(new HttpError(401, 'Invalid or expired session'))
  }
}
