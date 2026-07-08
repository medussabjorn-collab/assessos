import { Router } from 'express';
import * as ctrl from '../controllers/assessmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All authenticated users
router.use(authenticate);

// Start a session for a given module
router.post('/sessions/:moduleId/start',        authorize('admin','candidate'), ctrl.startSession);

// Get current question in a session
router.get('/sessions/:sessionId/question',     authorize('admin','candidate'), ctrl.getCurrentQuestion);

// Submit a single answer
router.post('/sessions/:sessionId/answer',      authorize('admin','candidate'), ctrl.submitAnswer);

// Submit / finish the whole session
router.post('/sessions/:sessionId/submit',      authorize('admin','candidate'), ctrl.submitSession);

// Results
router.get('/results',                          ctrl.getMyResults);
router.get('/results/:resultId',                ctrl.getResultById);

export default router;
