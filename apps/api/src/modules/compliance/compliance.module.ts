import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { BiasAuditService } from './bias-audit.service';
import { SelfIdService } from './self-id.service';
import { ExplanationService } from './explanation.service';
import { ReviewRequestService } from './review-request.service';
import { DataExportService } from './data-export.service';
import { BiometricConsentService } from './biometric-consent.service';
import { PrismaService } from '../../database/prisma.service';
import { AssessmentModule } from '../assessment/assessment.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [AssessmentModule, WebhooksModule],
  controllers: [ComplianceController],
  providers: [
    BiasAuditService,
    SelfIdService,
    ExplanationService,
    ReviewRequestService,
    DataExportService,
    BiometricConsentService,
    PrismaService,
  ],
  exports: [
    BiasAuditService,
    SelfIdService,
    ExplanationService,
    ReviewRequestService,
    DataExportService,
    BiometricConsentService,
  ],
})
export class ComplianceModule {}
