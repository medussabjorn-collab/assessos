import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { LeadershipService } from './leadership.service';
import { QuestionBankService } from './question-bank.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    LeadershipService,
    QuestionBankService,
    PrismaService,
  ],
  exports: [AssessmentService, LeadershipService, QuestionBankService],
})
export class AssessmentModule {}
