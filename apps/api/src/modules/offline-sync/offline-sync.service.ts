import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WebhookDispatchService } from '../webhooks/webhook-dispatch.service';
import { ProctoringService, ProctoringEventType } from '../proctoring/proctoring.service';

export type SyncItemType = 'answer' | 'proctor_event' | 'session_submit';

export interface SyncItem {
  type: SyncItemType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface SyncItemResult {
  type: SyncItemType;
  sessionId: string;
  success: boolean;
  error?: string;
}

/**
 * Ported from leadership-assessment routes/offlineSync.ts. Client queues
 * assessment/proctoring events while offline (PWA background sync) and
 * replays them here on reconnect, in original order, one item's failure
 * never blocking the rest.
 *
 * Fix vs the original: leadership declared `proctor_event` in its schema but
 * never handled it in the loop (silently no-op'd, same as an unknown type
 * would). Wired here to the real ProctoringService so it actually feeds the
 * session risk engine.
 */
@Injectable()
export class OfflineSyncService {
  private readonly logger = new Logger(OfflineSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatch: WebhookDispatchService,
    private readonly proctoring: ProctoringService,
  ) {}

  async sync(tenantId: string, userId: string, items: SyncItem[]) {
    // Preserve client-queued order — later items may depend on earlier ones
    // (e.g. an answer before the session_submit that finalizes them).
    const ordered = [...items].sort((a, b) => a.timestamp - b.timestamp);

    const results: SyncItemResult[] = [];
    for (const item of ordered) {
      try {
        await this.applyItem(tenantId, userId, item);
        results.push({ type: item.type, sessionId: item.sessionId, success: true });
      } catch (err) {
        this.logger.warn(`Offline sync item failed (${item.type}/${item.sessionId}): ${err}`);
        results.push({
          type: item.type,
          sessionId: item.sessionId,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      synced: results.filter((r) => r.success).length,
      total: items.length,
      results,
    };
  }

  private async applyItem(tenantId: string, userId: string, item: SyncItem) {
    switch (item.type) {
      case 'answer':
        return this.applyAnswer(tenantId, item);
      case 'proctor_event':
        return this.applyProctorEvent(tenantId, userId, item);
      case 'session_submit':
        return this.applySessionSubmit(tenantId, userId, item);
    }
  }

  private async applyAnswer(tenantId: string, item: SyncItem) {
    const p = item.payload as {
      questionId: string;
      selectedOption?: number | null;
      isFlagged?: boolean;
      timeSpentSec?: number;
    };
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: item.sessionId, tenantId },
    });
    if (!session) throw new Error('Session not found');

    // Upsert into SessionAnswer — the per-question record, distinct from the
    // whole-blob `answers` JSON the online submit path writes.
    await this.prisma.sessionAnswer.upsert({
      where: { sessionId_questionId: { sessionId: item.sessionId, questionId: p.questionId } },
      update: {
        selectedOption: p.selectedOption,
        isFlagged: p.isFlagged ?? false,
        timeSpentSec: p.timeSpentSec ?? 0,
        answeredAt: new Date(item.timestamp),
      },
      create: {
        tenantId,
        sessionId: item.sessionId,
        questionId: p.questionId,
        selectedOption: p.selectedOption,
        isFlagged: p.isFlagged ?? false,
        timeSpentSec: p.timeSpentSec ?? 0,
        answeredAt: new Date(item.timestamp),
      },
    });
  }

  private async applyProctorEvent(tenantId: string, userId: string, item: SyncItem) {
    const p = item.payload as { eventType: ProctoringEventType; metadata?: Record<string, unknown> };
    await this.proctoring.logEvent(tenantId, userId, {
      sessionId: item.sessionId,
      eventType: p.eventType,
      metadata: p.metadata,
    });
  }

  private async applySessionSubmit(tenantId: string, userId: string, item: SyncItem) {
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: item.sessionId, tenantId, userId },
    });
    if (!session) throw new Error('Session not found');
    if (session.status === 'done') return; // already finalized, idempotent

    const updated = await this.prisma.assessmentSession.update({
      where: { id: item.sessionId },
      data: { status: 'done', submittedAt: new Date(item.timestamp) },
    });

    void this.webhookDispatch.dispatch(tenantId, 'assessment.completed', {
      sessionId: updated.id,
      userId,
      pillar: updated.pillar,
    });
  }
}
