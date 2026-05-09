import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js'
import { getEventsByCategoryStats } from '../controllers/statsController.js'

const router = Router()

router.get('/stats/by-category', asyncHandler(getEventsByCategoryStats))
router.get('/', asyncHandler(listEvents))
router.post('/', requireAuth, asyncHandler(createEvent))
router.get('/:id', asyncHandler(getEventById))
router.patch('/:id', requireAuth, asyncHandler(updateEvent))
router.delete('/:id', requireAuth, asyncHandler(deleteEvent))

export default router
