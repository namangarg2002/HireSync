import express from 'express';
import protectRoute from '../middlewares/protectRoute.js';
import { createSession, getActiveSession, getMyRecentSessions, getSessionById, joinSession, endSession } from '../controllers/sessionController.js';

const router = express.Router()

router.post('/', protectRoute, createSession);
router.get('/active', protectRoute, getActiveSession);
router.get('/my-recent', protectRoute, getMyRecentSessions);

router.get('/:sessionId', protectRoute, getSessionById);
router.post('/:sessionId/join', protectRoute, joinSession);
router.post('/:sessionId/end', protectRoute, endSession);

export default router;