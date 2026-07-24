import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { WebhookDispatchService } from './webhook-dispatch.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhookSubscriptionService, WebhookDispatchService, PrismaService],
  exports: [WebhookSubscriptionService, WebhookDispatchService],
})
export class WebhooksModule {}
