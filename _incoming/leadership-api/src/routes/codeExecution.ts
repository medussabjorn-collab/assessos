import { Router } from 'express';
import * as ctrl from '../controllers/codeExecutionController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const execLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'Too many code executions. Try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(authenticate);

router.get('/languages',  ctrl.getLanguages);
router.post('/submit',    execLimit, ctrl.submitCode);

export default router;
