import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

export const WEBHOOK_EVENT_TYPES = [
  'assessment.completed',
  'report.score_threshold_crossed',
  'bias_audit.alert',
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

@Injectable({ scope: Scope.REQUEST })
export class WebhookSubscriptionService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async register(url: string, eventTypes: WebhookEventType[]) {
    if (!url || !/^https?:\/\//.test(url)) {
      throw new Error('A valid http(s) URL is required');
    }
    const invalid = eventTypes.filter((e) => !WEBHOOK_EVENT_TYPES.includes(e));
    if (invalid.length > 0) {
      throw new Error(`Unknown event type(s): ${invalid.join(', ')}`);
    }

    // Returned once, in full, on creation — same convention as an API key.
    // Never returned again by list().
    const secret = randomBytes(32).toString('hex');

    return this.prisma.webhookSubscription.create({
      data: { tenantId: this.tenantId, url, eventTypes, secret },
    });
  }

  async list() {
    const subs = await this.prisma.webhookSubscription.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    // Secret is write-once — never included in a list response.
    return subs.map(({ secret: _secret, ...rest }) => rest);
  }

  async deactivate(id: string) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!sub) {
      throw new NotFoundException('Webhook subscription not found');
    }
    return this.prisma.webhookSubscription.update({
      where: { id },
      data: { active: false },
    });
  }
}
