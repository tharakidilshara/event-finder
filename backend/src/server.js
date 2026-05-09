import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { HttpError } from './middleware/httpError.js'
import { errorHandler } from './middleware/errorHandler.js'
import eventRoutes from './routes/eventRoutes.js'
import userRoutes from './routes/userRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Always load backend/.env even if Node was started from the repo root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const app = express()
const PORT = Number(process.env.PORT) || 5000
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : mongoose.connection.readyState,
  })
})

app.use('/api/events', eventRoutes)
app.use('/api/users', userRoutes)

app.use((_req, _res, next) => {
  next(new HttpError(404, 'Not found'))
})

app.use(errorHandler)

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI. Copy backend/.env.example to backend/.env and set your Atlas URI.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
