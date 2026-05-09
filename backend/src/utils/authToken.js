import jwt from 'jsonwebtoken'

/**
 * @param {{ id: string, email: string }} user
 * @returns {string}
 */
export function signUserToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' })
}
