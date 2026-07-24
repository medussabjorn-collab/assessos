import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogInput {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  action?: string;
  userId?: string;
  page?: string;
  limit?: string;
}

/**
 * Ported from leadership-assessment middleware/audit.ts + adminController audit
 * read. Writes are fire-and-forget and never throw (an audit failure must not
 * break the audited action). Tenant-scoped for assessos.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId ?? undefined,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Audit log write failed: ${err}`);
    }
  }

  async query(tenantId: string, q: AuditQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = { tenantId };
    if (q.action) where.action = q.action as AuditAction;
    if (q.userId) where.userId = q.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
