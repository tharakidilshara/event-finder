import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { addSaved, listSaved, removeSaved } from '../controllers/savedBookmarkController.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listSaved))
router.post('/', requireAuth, asyncHandler(addSaved))
router.delete('/:eventId', requireAuth, asyncHandler(removeSaved))

export default router
