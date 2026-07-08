import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

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
