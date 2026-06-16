import { Router } from 'express';
import * as ctrl from '../controllers/proctoringController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/event',                    ctrl.logEvent);
router.get('/report/:sessionId',         ctrl.getReport);

export default router;
