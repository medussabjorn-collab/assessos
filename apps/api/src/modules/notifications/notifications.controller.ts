import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import {
  NotificationsService,
  NotificationType,
} from './notifications.service';

const ADMIN_ROLES = ['org_admin', 'super_admin'];

@Controller('api/notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolve(req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return { tenantId, userId: user.id };
  }

  // Admin sends a notification to a user in the tenant (also pushes live via
  // the realtime gateway).
  @Post()
  async create(
    @Request() req: any,
    @Body()
    body: { userId: string; type?: NotificationType; title: string; message: string; metadata?: Record<string, unknown> },
  ) {
    const { tenantId } = await this.resolve(req);
    const sender = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!sender || !ADMIN_ROLES.includes(sender.role)) {
      throw new ForbiddenException('Only org admins can send notifications');
    }
    const data = await this.notifications.create({
      tenantId,
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
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.notifications.listForUser(tenantId, userId, unread === 'true');
    return { success: true, data };
  }

  @Put(':id/read')
  async markRead(@Request() req: any, @Param('id') id: string) {
    const { tenantId, userId } = await this.resolve(req);
    const { count } = await this.notifications.markRead(tenantId, userId, id);
    return { success: true, data: { updated: count } };
  }

  @Put('read-all')
  async markAllRead(@Request() req: any) {
    const { tenantId, userId } = await this.resolve(req);
    const { count } = await this.notifications.markAllRead(tenantId, userId);
    return { success: true, data: { updated: count } };
  }
}
