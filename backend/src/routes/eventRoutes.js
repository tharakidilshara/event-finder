import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
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
router.post('/', asyncHandler(createEvent))
router.get('/:id', asyncHandler(getEventById))
router.patch('/:id', asyncHandler(updateEvent))
router.delete('/:id', asyncHandler(deleteEvent))

export default router
