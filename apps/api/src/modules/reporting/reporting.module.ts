import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { ReportGeneratorService } from './report-generator.service';
import { ReportPdfService } from './report-pdf.service';
import { PrismaService } from '../../database/prisma.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [WebhooksModule, TenantModule],
  controllers: [ReportingController],
  providers: [ReportingService, ReportGeneratorService, ReportPdfService, PrismaService],
  exports: [ReportingService],
})
export class ReportingModule {}
