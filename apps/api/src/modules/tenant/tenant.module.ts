import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SettingsController } from './settings.controller';
import { WhiteLabelService } from './white-label.service';

@Module({
  controllers: [SettingsController],
  providers: [PrismaService, WhiteLabelService],
  exports: [PrismaService, WhiteLabelService],
})
export class TenantModule {}
