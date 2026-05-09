import mongoose from 'mongoose'
import { HttpError } from './httpError.js'

/**
 * Express error-handling middleware: JSON body, stable shape.
 * @type {import('express').ErrorRequestHandler}
 */
export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return

  let status = 500
  let message = 'Something went wrong'

  if (err instanceof HttpError) {
    status = err.status
    message = err.message
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ')
  } else if (err instanceof mongoose.Error.CastError || err.name === 'CastError') {
    status = 400
    message = 'Invalid id'
  } else if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    status = 409
    message = 'Duplicate value violates a unique constraint'
  } else {
    console.error(err)
  }

  res.status(status).json({ error: { message } })
}
