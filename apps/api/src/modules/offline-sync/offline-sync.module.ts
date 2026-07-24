import { Module } from '@nestjs/common';
import { OfflineSyncController } from './offline-sync.controller';
import { OfflineSyncService } from './offline-sync.service';
import { PrismaService } from '../../database/prisma.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ProctoringModule } from '../proctoring/proctoring.module';

@Module({
  imports: [WebhooksModule, ProctoringModule],
  controllers: [OfflineSyncController],
  providers: [OfflineSyncService, PrismaService],
  exports: [OfflineSyncService],
})
export class OfflineSyncModule {}
