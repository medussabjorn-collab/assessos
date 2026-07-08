import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import * as R from '../utils/response';

const configSchema = z.object({
  timeLimitMin:     z.number().int().min(10).max(480).optional(),
  passMark:         z.number().min(0).max(100).optional(),
  negativeMarking:  z.boolean().optional(),
  negativePenalty:  z.number().min(0).max(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions:   z.boolean().optional(),
  aiProctoring:     z.boolean().optional(),
  adaptiveMode:     z.boolean().optional(),
  totalQuestions:   z.number().int().min(10).max(200).optional(),
});

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', search, role } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (role)   where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: Number(limit), select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    R.paginated(res, users, Number(page), Number(limit), total);
  } catch (err) { next(err); }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } });
    if (!user) { R.notFound(res, 'User not found'); return; }
    R.ok(res, user);
  } catch (err) { next(err); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ name: z.string().min(2).optional(), role: z.enum(['admin','candidate','viewer','recruiter']).optional(), isActive: z.boolean().optional() });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, email: true, name: true, role: true, isActive: true } });
    R.ok(res, user, 'User updated');
  } catch (err) { next(err); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    R.noContent(res);
  } catch (err) { next(err); }
}

// ─── Configs ──────────────────────────────────────────────────────────────────

export async function listConfigs(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const configs = await prisma.assessmentConfig.findMany();
    R.ok(res, configs);
  } catch (err) { next(err); }
}

export async function updateConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = configSchema.parse(req.body);
    // moduleId is unique per organization; look up the row first (default tenant)
    const existing = await prisma.assessmentConfig.findFirst({
      where: { moduleId: req.params.moduleId as import('@prisma/client').AssessmentModuleId },
    });
    if (!existing) { R.notFound(res, 'Config not found'); return; }
    const config = await prisma.assessmentConfig.update({ where: { id: existing.id }, data });
    R.ok(res, config, 'Config updated');
  } catch (err) { next(err); }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '50', action, userId } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true, name: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    R.paginated(res, logs, Number(page), Number(limit), total);
  } catch (err) { next(err); }
}

// ─── Platform Stats ────────────────────────────────────────────────────────────

export async function getStats(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, totalSessions, totalResults, recentAlerts] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.assessmentSession.count({ where: { status: { in: ['submitted', 'graded'] } } }),
      prisma.assessmentResult.count(),
      prisma.proctoringEventLog.count({ where: { occurredAt: { gte: new Date(Date.now() - 86400000) } } }),
    ]);
    const passRate = await prisma.assessmentResult.aggregate({ _avg: { score: true } });

    R.ok(res, {
      totalUsers,
      totalAssessments:  totalSessions,
      totalResults,
      recentAlerts,
      avgScore:          Math.round(passRate._avg.score ?? 0),
    });
  } catch (err) { next(err); }
}
