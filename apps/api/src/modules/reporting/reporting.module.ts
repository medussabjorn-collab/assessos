import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { ReportGeneratorService } from './report-generator.service';
import { PrismaService } from '../../database/prisma.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [ReportingController],
  providers: [ReportingService, ReportGeneratorService, PrismaService],
  exports: [ReportingService],
})
export class ReportingModule {}
