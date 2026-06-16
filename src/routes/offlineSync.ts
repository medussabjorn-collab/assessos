import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as assessmentSvc from '../services/assessmentService';
import * as R from '../utils/response';

const router = Router();

router.use(authenticate);

const syncPayloadSchema = z.object({
  items: z.array(z.object({
    type:      z.enum(['answer', 'proctor_event', 'session_submit']),
    sessionId: z.string(),
    payload:   z.record(z.unknown()),
    timestamp: z.number(),
  })),
});

router.post('/sync', async (req: AuthRequest, res, next) => {
  try {
    const { items } = syncPayloadSchema.parse(req.body);
    const results: Array<{ type: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      try {
        if (item.type === 'answer') {
          const p = item.payload as { questionId: string; selectedOption: number | null; isFlagged?: boolean; timeSpentSec?: number };
          await assessmentSvc.submitAnswer(
            item.sessionId, req.user!.sub,
            p.questionId, p.selectedOption,
            p.isFlagged, p.timeSpentSec
          );
        } else if (item.type === 'session_submit') {
          await assessmentSvc.submitSession(item.sessionId, req.user!.sub);
        }
        results.push({ type: item.type, success: true });
      } catch (err) {
        results.push({ type: item.type, success: false, error: (err as Error).message });
      }
    }

    R.ok(res, { synced: results.filter(r => r.success).length, total: items.length, results });
  } catch (err) { next(err); }
});

export default router;
