import { Router } from 'express'
import { listEvents } from '../controllers/eventController.js'

const router = Router()

router.get('/', listEvents)

export default router
