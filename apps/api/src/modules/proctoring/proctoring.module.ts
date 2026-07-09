import { Module } from '@nestjs/common';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ProctoringController, IdentityController],
  providers: [ProctoringService, IdentityService, PrismaService],
  exports: [ProctoringService, IdentityService],
})
export class ProctoringModule {}
