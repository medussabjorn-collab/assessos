import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import {
  NotificationsService,
  NotificationType,
} from './notifications.service';

@Controller('api/notifications')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // Admin sends a notification to a user in the tenant (also pushes live via
  // the realtime gateway).
  @Post()
  @RequirePermission(PERMISSIONS.NOTIFICATIONS_SEND)
  async create(
    @Request() req: any,
    @Body()
    body: { userId: string; type?: NotificationType; title: string; message: string; metadata?: Record<string, unknown> },
  ) {
    const data = await this.notifications.create({
      tenantId: req.resolvedUser.tenantId,
      userId: body.userId,
      type: body.type ?? 'info',
      title: body.title,
      message: body.message,
      metadata: body.metadata,
    });
    return { success: true, data };
  }

  @Get()
  async list(@Request() req: any, @Query('unread') unread?: string) {
    const data = await this.notifications.listForUser(
      req.resolvedUser.tenantId,
      req.resolvedUser.id,
      unread === 'true',
    );
    return { success: true, data };
  }

  @Put(':id/read')
  async markRead(@Request() req: any, @Param('id') id: string) {
    const { count } = await this.notifications.markRead(
      req.resolvedUser.tenantId,
      req.resolvedUser.id,
      id,
    );
    return { success: true, data: { updated: count } };
  }

  @Put('read-all')
  async markAllRead(@Request() req: any) {
    const { count } = await this.notifications.markAllRead(
      req.resolvedUser.tenantId,
      req.resolvedUser.id,
    );
    return { success: true, data: { updated: count } };
  }
}
