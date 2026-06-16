import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as svc from '../services/assessmentService';
import { AuthRequest, AssessmentModuleId } from '../types';
import * as R from '../utils/response';

const moduleIdSchema = z.enum(['technical','attitude','behavioral','psychometric','communication']);

const submitAnswerSchema = z.object({
  questionId:     z.string().min(1),
  selectedOption: z.number().int().min(0).max(9).nullable(),
  isFlagged:      z.boolean().optional().default(false),
  timeSpentSec:   z.number().int().min(0).optional().default(0),
});

export async function startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const moduleId = moduleIdSchema.parse(req.params.moduleId);
    const session = await svc.startSession(req.user!.sub, moduleId);
    R.created(res, session, 'Assessment session started');
  } catch (err) { next(err); }
}

export async function getCurrentQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getCurrentQuestion(req.params.sessionId, req.user!.sub);
    R.ok(res, data);
  } catch (err) { next(err); }
}

export async function submitAnswer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId, selectedOption, isFlagged, timeSpentSec } = submitAnswerSchema.parse(req.body);
    const result = await svc.submitAnswer(
      req.params.sessionId,
      req.user!.sub,
      questionId,
      selectedOption,
      isFlagged,
      timeSpentSec
    );
    R.ok(res, result);
  } catch (err) { next(err); }
}

export async function submitSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.submitSession(req.params.sessionId, req.user!.sub);
    R.ok(res, result, 'Assessment submitted and graded');
  } catch (err) { next(err); }
}

export async function getMyResults(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const moduleId = req.query.moduleId as AssessmentModuleId | undefined;
    const results = await svc.getUserResults(req.user!.sub, moduleId);
    R.ok(res, results);
  } catch (err) { next(err); }
}

export async function getResultById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.getResultById(req.params.resultId, req.user!.sub);
    R.ok(res, result);
  } catch (err) { next(err); }
}
