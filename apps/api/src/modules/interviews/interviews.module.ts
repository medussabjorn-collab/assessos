import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { VideoRoomService } from './video-room.service';
import { ProctoringService } from './proctoring.service';
import { InterviewFeedbackService } from './interview-feedback.service';
import { SchedulingService } from './scheduling.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [InterviewController],
  providers: [
    InterviewService,
    VideoRoomService,
    ProctoringService,
    InterviewFeedbackService,
    SchedulingService,
    PrismaService,
  ],
  exports: [
    InterviewService,
    VideoRoomService,
    ProctoringService,
    InterviewFeedbackService,
    SchedulingService,
  ],
})
export class InterviewsModule {}
