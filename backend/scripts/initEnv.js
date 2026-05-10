import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.join(__dirname, '..')
const target = path.join(backendRoot, '.env')
const example = path.join(backendRoot, '.env.example')

if (!fs.existsSync(example)) {
  console.error('Missing backend/.env.example')
  process.exit(1)
}

if (fs.existsSync(target)) {
  console.log('backend/.env already exists — leaving it unchanged.')
  process.exit(0)
}

fs.copyFileSync(example, target)
console.log('Created backend/.env from .env.example')
console.log('Edit MONGODB_URI and JWT_SECRET before starting the API.')
