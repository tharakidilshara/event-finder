import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { listEventsByUser } from '../controllers/userController.js'

const router = Router()

router.get('/:userId/events', asyncHandler(listEventsByUser))

export default router
