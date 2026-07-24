import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { WebhookEventType } from './webhook-subscription.service';

// Deliberately NOT request-scoped: ReportGeneratorService dispatches
// report.score_threshold_crossed from a fire-and-forget background job
// (generateInBackground), which can still be running after the triggering
// HTTP request has already returned — there's no request-scoped tenantId
// to read at that point. tenantId is an explicit argument instead, sourced
// from whatever record the caller already has (this.tenantId for
// request-scoped callers, report.tenantId for the background job).
//
// Fire-and-forget dispatch — same error-swallowing convention as
// ReportGeneratorService.generateInBackground. A subscriber's endpoint
// being down must never break the request that triggered the event.
@Injectable()
export class WebhookDispatchService {
  private readonly logger = new Logger(WebhookDispatchService.name);

  constructor(private prisma: PrismaService) {}

  async dispatch(
    tenantId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { tenantId, active: true, eventTypes: { has: eventType } },
    });

    const body = JSON.stringify({ eventType, payload, sentAt: new Date().toISOString() });

    await Promise.all(
      subscriptions.map(async (sub) => {
        const signature = createHmac('sha256', sub.secret).update(body).digest('hex');
        try {
          await fetch(sub.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': eventType,
            },
            body,
          });
        } catch (error) {
          this.logger.error(`Webhook dispatch to ${sub.url} failed: ${error}`);
        }
      }),
    );
  }
}
