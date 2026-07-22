import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentConfigService } from './assessment-config.service';
import { AssessmentConfigController } from './assessment-config.controller';
import { LeadershipService } from './leadership.service';
import { QuestionBankService } from './question-bank.service';
import { ScenarioGeneratorService } from './scenario-generator.service';
import { ScenarioReviewService } from './scenario-review.service';
import { IrtAdaptiveTestingService } from './irt-adaptive-testing.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantModule } from '../tenant/tenant.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [TenantModule, WebhooksModule],
  controllers: [AssessmentController, AssessmentConfigController],
  providers: [
    AssessmentService,
    AssessmentConfigService,
    LeadershipService,
    QuestionBankService,
    ScenarioGeneratorService,
    ScenarioReviewService,
    IrtAdaptiveTestingService,
    PrismaService,
  ],
  exports: [
    AssessmentService,
    LeadershipService,
    QuestionBankService,
    ScenarioGeneratorService,
    ScenarioReviewService,
    IrtAdaptiveTestingService,
  ],
})
export class AssessmentModule {}
