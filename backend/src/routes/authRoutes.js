import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { login, me, register } from '../controllers/authController.js'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.get('/me', asyncHandler(me))

export default router
