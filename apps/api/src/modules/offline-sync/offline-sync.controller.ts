import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { OfflineSyncService, SyncItem } from './offline-sync.service';

@Controller('api/offline-sync')
@UseGuards(FirebaseAuthGuard)
export class OfflineSyncController {
  constructor(
    private readonly sync: OfflineSyncService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('sync')
  async syncItems(@Request() req: any, @Body() body: { items: SyncItem[] }) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    const data = await this.sync.sync(tenantId, user.id, body.items ?? []);
    return { success: true, data };
  }
}
