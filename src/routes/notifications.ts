import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as svc from '../services/notificationService';
import { AuthRequest } from '../types';
import * as R from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await svc.getUserNotifications(req.user!.sub, unreadOnly);
    R.ok(res, notifications);
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    await svc.markNotificationRead(req.params.id, req.user!.sub);
    R.noContent(res);
  } catch (err) { next(err); }
});

router.put('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await svc.markAllRead(req.user!.sub);
    R.noContent(res);
  } catch (err) { next(err); }
});

export default router;
