import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Ported from leadership-assessment notificationService. Persists to Postgres
 * and pushes live over the realtime gateway (socket room `user:<id>`) — the
 * gateway landed with the realtime module, so delivery is now live.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
    // Fire-and-forget live push; a socket failure must not fail the write.
    this.realtime.emitToUser(input.userId, 'notification', notification);
    return notification;
  }

  async listForUser(tenantId: string, userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(tenantId: string, userId: string, id: string) {
    // updateMany so a mismatched id/user is a no-op, not an error.
    return this.prisma.notification.updateMany({
      where: { id, tenantId, userId },
      data: { read: true },
    });
  }

  async markAllRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });
  }

  // Convenience emitters kept for parity with leadership; callers pass tenant.
  async notifyAssessmentComplete(
    tenantId: string,
    userId: string,
    moduleId: string,
    score: number,
    passed: boolean,
  ) {
    return this.create({
      tenantId,
      userId,
      type: passed ? 'success' : 'warning',
      title: `${moduleId} assessment complete`,
      message: `You scored ${score.toFixed(1)}% — ${passed ? 'Passed' : 'Did not pass'}`,
      metadata: { moduleId, score, passed },
    });
  }

  async notifyProctoringAlert(
    tenantId: string,
    userId: string,
    sessionId: string,
    eventType: string,
    risk: number,
  ) {
    return this.create({
      tenantId,
      userId,
      type: risk >= 70 ? 'error' : 'warning',
      title: 'Proctoring alert',
      message: `Event: ${eventType.replace(/_/g, ' ')} · Risk score: ${risk}`,
      metadata: { sessionId, eventType, risk },
    });
  }
}
