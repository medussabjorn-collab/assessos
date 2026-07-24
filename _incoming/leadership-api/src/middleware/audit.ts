import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { AuditAction, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export async function logAudit(
  userId: string | null,
  action: AuditAction,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     userId ?? undefined,
        action,
        resource,
        resourceId,
        metadata:   (metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    logger.error('Audit log write failed:', err);
  }
}

export function auditMiddleware(action: AuditAction, resource?: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    next();
    // fire-and-forget after route runs
    void logAudit(
      req.user?.sub ?? null,
      action,
      resource,
      (req.params.id as string) ?? undefined,
      { method: req.method, path: req.path, body: req.body },
      req.ip,
      req.headers['user-agent']
    );
  };
}
