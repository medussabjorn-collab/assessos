import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { WebhookSubscriptionService, WebhookEventType, WEBHOOK_EVENT_TYPES } from './webhook-subscription.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(
    private subscriptions: WebhookSubscriptionService,
    private prisma: PrismaService,
  ) {}

  private async requireOrgAdmin(req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'org_admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Only org admins can manage webhooks');
    }
  }

  @Get('event-types')
  @UseGuards(FirebaseAuthGuard)
  listEventTypes() {
    return { success: true, data: WEBHOOK_EVENT_TYPES };
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async register(
    @Request() req: any,
    @Body() body: { url: string; eventTypes: WebhookEventType[] },
  ) {
    await this.requireOrgAdmin(req);
    const subscription = await this.subscriptions.register(body.url, body.eventTypes ?? []);
    return { success: true, data: subscription };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async list(@Request() req: any) {
    await this.requireOrgAdmin(req);
    const subscriptions = await this.subscriptions.list();
    return { success: true, data: subscriptions };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async deactivate(@Request() req: any, @Param('id') id: string) {
    await this.requireOrgAdmin(req);
    const subscription = await this.subscriptions.deactivate(id);
    return { success: true, data: subscription };
  }
}
