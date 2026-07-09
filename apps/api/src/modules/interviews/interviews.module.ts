import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { VideoRoomService } from './video-room.service';
import { InterviewFeedbackService } from './interview-feedback.service';
import { SchedulingService } from './scheduling.service';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceModule } from '../compliance/compliance.module';
import { ProctoringModule } from '../proctoring/proctoring.module';

@Module({
  // ProctoringService now comes from the unified proctoring module (the old
  // stub interviews/proctoring.service.ts was replaced by it).
  imports: [ComplianceModule, ProctoringModule],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    VideoRoomService,
    InterviewFeedbackService,
    SchedulingService,
    PrismaService,
  ],
  exports: [
    InterviewService,
    VideoRoomService,
    InterviewFeedbackService,
    SchedulingService,
  ],
})
export class InterviewsModule {}
