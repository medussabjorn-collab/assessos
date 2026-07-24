import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { WebhookSubscriptionService, WebhookEventType, WEBHOOK_EVENT_TYPES } from './webhook-subscription.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private subscriptions: WebhookSubscriptionService) {}

  @Get('event-types')
  @UseGuards(FirebaseAuthGuard)
  listEventTypes() {
    return { success: true, data: WEBHOOK_EVENT_TYPES };
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.WEBHOOKS_MANAGE)
  async register(@Body() body: { url: string; eventTypes: WebhookEventType[] }) {
    const subscription = await this.subscriptions.register(body.url, body.eventTypes ?? []);
    return { success: true, data: subscription };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.WEBHOOKS_MANAGE)
  async list() {
    const subscriptions = await this.subscriptions.list();
    return { success: true, data: subscriptions };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.WEBHOOKS_MANAGE)
  async deactivate(@Param('id') id: string) {
    const subscription = await this.subscriptions.deactivate(id);
    return { success: true, data: subscription };
  }
}
