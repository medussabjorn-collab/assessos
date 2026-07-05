import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { ReportGeneratorService } from './report-generator.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, ReportGeneratorService, PrismaService],
  exports: [ReportingService],
})
export class ReportingModule {}
