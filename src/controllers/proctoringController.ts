import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as svc from '../services/proctoringService';
import { notifyProctoringAlert } from '../services/notificationService';
import { AuthRequest } from '../types';
import * as R from '../utils/response';

const eventSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum([
    'face_not_detected','multiple_faces','looking_away','suspicious_object',
    'tab_switch','window_blur','fullscreen_exit','copy_paste',
    'vpn_detected','audio_detected','phone_detected',
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export async function logEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = eventSchema.parse(req.body);
    const result = await svc.logProctoringEvent(payload, req.user!.sub);

    if (result.level !== 'safe') {
      void notifyProctoringAlert(req.user!.sub, payload.sessionId, payload.eventType, result.totalRisk);
    }

    R.ok(res, result);
  } catch (err) { next(err); }
}

export async function getReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await svc.getProctoringReport(req.params.sessionId);
    R.ok(res, report);
  } catch (err) { next(err); }
}
