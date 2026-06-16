import { Router } from 'express';
import * as ctrl from '../controllers/questionController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public-ish (authenticated) reads
router.get('/',           authenticate, ctrl.listQuestions);
router.get('/:id',        authenticate, ctrl.getQuestion);

// Admin writes
router.post('/',          authenticate, requireAdmin, ctrl.createQuestion);
router.post('/bulk',      authenticate, requireAdmin, ctrl.bulkImport);
router.put('/:id',        authenticate, requireAdmin, ctrl.updateQuestion);
router.delete('/:id',     authenticate, requireAdmin, ctrl.deleteQuestion);

export default router;
