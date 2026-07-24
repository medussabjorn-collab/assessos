import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentConfigService } from './assessment-config.service';
import { AssessmentConfigController } from './assessment-config.controller';
import { ScenarioGeneratorService } from './scenario-generator.service';
import { ScenarioReviewService } from './scenario-review.service';
import { IrtAdaptiveTestingService } from './irt-adaptive-testing.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantModule } from '../tenant/tenant.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { PillarQuestionModule } from '../pillar-questions/pillar-question.module';
import { ProctoringModule } from '../proctoring/proctoring.module';

@Module({
  imports: [
    TenantModule,
    WebhooksModule,
    RealtimeModule,
    QuestionBankModule,
    PillarQuestionModule,
    ProctoringModule,
  ],
  controllers: [AssessmentController, AssessmentConfigController],
  providers: [
    AssessmentService,
    AssessmentConfigService,
    ScenarioGeneratorService,
    ScenarioReviewService,
    IrtAdaptiveTestingService,
    PrismaService,
  ],
  exports: [
    AssessmentService,
    ScenarioGeneratorService,
    ScenarioReviewService,
    IrtAdaptiveTestingService,
  ],
})
export class AssessmentModule {}
